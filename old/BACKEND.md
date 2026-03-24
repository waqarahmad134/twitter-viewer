# Twitter Viewer — Backend Architecture

How the Express API fetches and serves Twitter profile and tweet data via [Nitter](https://github.com/zedeus/nitter).

---

## Overview

| Component | Purpose |
|-----------|---------|
| **Express** | HTTP server, routes, CORS |
| **Nitter** | Data source — alternative Twitter frontend (profiles + tweets) |
| **Puppeteer** | Headless Chrome to bypass "Verifying your browser" on public Nitter |
| **Parsers** | Extract `username`, `tweetId` from input; parse Nitter HTML into JSON |

---

## Architecture

```
┌─────────────┐     GET /api/profile?handle=xxx     ┌──────────────────┐
│   Frontend  │ ──────────────────────────────────► │   Express API    │
│  (React)    │                                      │   (port 3001)    │
└─────────────┘     GET /api/tweet?url=xxx          └────────┬─────────┘
       ▲                      │                              │
       │                      │                              ▼
       │              ┌───────┴───────┐            ┌──────────────────┐
       │              │  JSON response │            │  twitter service │
       │              └───────────────┘            │  (fetch/parse)   │
       │                                            └────────┬─────────┘
       │                                                     │
       │                           ┌─────────────────────────┴─────────────────────┐
       │                           │                                                 │
       │                           ▼                                                 ▼
       │              ┌─────────────────────┐                          ┌─────────────────────┐
       │              │  Local Nitter        │                          │  Public Nitter      │
       │              │  (if NITTER_LOCAL)   │                          │  (nitter.net, etc.) │
       │              │  → node-fetch        │                          │  → Puppeteer        │
       │              └─────────────────────┘                          └─────────────────────┘
       │                                     │                                         │
       │                                     └────────────────┬────────────────────────┘
       │                                                      │
       │                                                      ▼
       │                                           ┌─────────────────────┐
       └───────────────────────────────────────────│  Parsed JSON        │
                                                   │  (profile / tweet)  │
                                                   └─────────────────────┘
```

---

## Request Flow

### 1. Profile (`GET /api/profile?handle=waqarahmad134`)

```
1. Route receives handle → extractUsername() normalizes (@waqarahmad134 → waqarahmad134)
2. fetchProfile(screenName) called
3. For each Nitter instance (local first if NITTER_LOCAL set):
   - Build URL: https://nitter.net/waqarahmad134
   - Fetch HTML: node-fetch (local) OR Puppeteer (public)
   - If HTML contains "profile-card" or "profile-bio" → parseNitterProfile()
   - Return structured JSON
4. If all instances fail → 503 error
```

### 2. Tweet (`GET /api/tweet?url=https://x.com/user/status/123`)

```
1. Route receives url → extractTweetUrlParts() returns { username, tweetId }
2. fetchTweet(username, tweetId) called
3. For each Nitter instance:
   - Build URL: https://nitter.net/user/status/123
   - Fetch HTML: node-fetch (local) OR Puppeteer (public)
   - If HTML contains "main-tweet" or "timeline-item" → parseNitterTweet()
   - Return structured JSON
4. If all instances fail → 503 error
```

---

## Data Source Strategy

### Option A: Local Nitter (`NITTER_LOCAL=http://localhost:3002`)

- No bot protection
- Uses plain `node-fetch`
- Requires self-hosted Nitter + Twitter session tokens
- See `nitter/NITTER-SETUP.md`

### Option B: Public Nitter (default)

- Instances like nitter.net use "Verifying your browser"
- Plain fetch gets challenge page, not real content
- **Puppeteer** launches headless Chrome, loads page, passes JS challenge
- Waits 4 seconds for redirect/verification
- Returns final HTML
- Instance order: nitter.net → nitter.poast.org → … (failover)

---

## API Endpoints

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/health` | — | `{ status: "ok" }` |
| GET | `/api/profile` | `handle` or `username` | Profile JSON |
| GET | `/api/tweet` | `url` or `username` + `id` | Tweet JSON |

### Profile JSON shape

```json
{
  "screenName": "waqarahmad134",
  "name": "waqarahmad",
  "description": "Eat, Sleep, code, crypto & Repeat 😂",
  "profileImageUrl": "https://...",
  "bannerUrl": "https://...",
  "followersCount": 35,
  "followingCount": 151,
  "tweetsCount": 245,
  "location": "Lahore",
  "joinDate": "July 2013",
  "tweets": [{ "text": "..." }]
}
```

### Tweet JSON shape

```json
{
  "id": "1234567890",
  "text": "Tweet content...",
  "createdAt": "Mar 15",
  "user": {
    "name": "User Name",
    "screenName": "username",
    "profileImageUrl": "https://...",
    "verified": false
  },
  "favoriteCount": 10,
  "retweetCount": 5,
  "replyCount": 2,
  "viewCount": 1000,
  "photos": ["https://..."],
  "video": { "url": "https://..." }
}
```

---

## Parsers (`server/src/utils/parsers.js`)

| Function | Input | Output | Example |
|----------|-------|--------|---------|
| `extractUsername` | @handle, URL, or plain | `username` or null | `@elonmusk` → `elonmusk` |
| `extractTweetUrlParts` | Tweet URL | `{ username, tweetId }` or null | `x.com/elonmusk/status/123` → `{ username: "elonmusk", tweetId: "123" }` |
| `extractTweetId` | URL or ID | `tweetId` or null | Used by frontend |

---

## HTML Parsing (Nitter Structure)

Nitter renders HTML from [Nim templates](https://github.com/zedeus/nitter). We use regex to extract data:

### Profile page

| Data | Nitter HTML pattern |
|------|----------------------|
| Bio | `class="profile-bio"` → `<p>` content |
| Name | `class="profile-card-fullname"` |
| Avatar | `class="profile-card-avatar"` → `<img src="..."` |
| Banner | `class="profile-banner"` → `href` or `style` url |
| Followers | `class="followers"` → `profile-stat-num` |
| Following | `class="following"` → `profile-stat-num` |
| Tweets | `class="posts"` → `profile-stat-num` |
| Location | `class="profile-location"` |
| Join date | `class="profile-joindate"` |
| Recent tweets | `class="tweet-content"` blocks |

### Tweet / status page

| Data | Nitter HTML pattern |
|------|----------------------|
| User avatar | `class="tweet-avatar"` → `<img src="..."` |
| Full name | `class="fullname"` |
| Username | `class="username"` or `@...` |
| Text | `class="tweet-content"` |
| Date | `class="tweet-published"` |
| Stats | `class="tweet-stats"` → numbers (replies, retweets, likes, views) |
| Media | `<img src="..."` (excluding avatar) |
| Video | `<video>` / `<source src="..." type="video/` |

### URL resolution

- Relative URLs (e.g. `/pic/...`) are turned into absolute using the Nitter base URL.
- Example: base `https://nitter.net`, `/pic/xxx` → `https://nitter.net/pic/xxx`

---

## Puppeteer

```javascript
// Singleton browser
getBrowser() → launches once, reuses

// Per-request page
fetchWithBrowser(url):
  1. newPage()
  2. setUserAgent (Chrome 120)
  3. goto(url, domcontentloaded, 20s timeout)
  4. wait 4s (for "Verifying your browser" redirect)
  5. page.content() → HTML string
  6. close page
```

Launch args: `--no-sandbox`, `--disable-blink-features=AutomationControlled` to reduce bot detection.

---

## Error Handling

| Scenario | HTTP | Response |
|----------|------|----------|
| Invalid input (bad handle/URL) | 400 | `{ error, message }` |
| Tweet deleted/unavailable | 404 | `{ error: "Tweet unavailable or deleted" }` |
| All Nitter instances fail | 503 | `{ error: "Profile/Tweet unavailable..." }` |
| Other | 500 | `{ error: err.message }` |

---

## File Structure

```
server/
├── src/
│   ├── index.js          # Express app, routes
│   ├── routes/
│   │   ├── profile.js    # GET /api/profile
│   │   └── tweet.js      # GET /api/tweet
│   ├── services/
│   │   └── twitter.js    # fetchProfile, fetchTweet, parsers
│   └── utils/
│       └── parsers.js    # extractUsername, extractTweetUrlParts
└── package.json
```

---

## Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 3001) |
| `NITTER_LOCAL` | Local Nitter URL (e.g. http://localhost:3002) — use fetch instead of Puppeteer |
