# Twitter Viewer

View Twitter profiles and tweets without an account. Clean, private, ad-free.

## Features

- **Tweet Viewer** — View any tweet with engagement stats and media (uses Syndication API)
- **Profile Viewer** — Browse profiles anonymously (uses Nitter instances)
- No login required
- One-click media download

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Data:** [Nitter](https://github.com/zedeus/nitter) instances only (profiles + tweets)

## Setup

```bash
# Install dependencies
npm run install:all

# Start backend (port 3001)
npm run dev:server

# In another terminal: start frontend (port 5173)
npm run dev:client
```

Then open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
twitter-viewer/
├── client/          # React frontend
├── server/          # Express API
└── PROJECT-CLONE-GUIDE.md
```

## API Endpoints

- `GET /api/tweet?url=<tweet_url>` — Fetch tweet (full URL required, e.g. https://x.com/user/status/123)
- `GET /api/profile?handle=<username>` — Fetch profile

## Notes

- **Data source:** [Nitter](https://github.com/zedeus/nitter) — public instances via Puppeteer, or your own local instance
- **Puppeteer** — Public Nitter instances use "Verifying your browser" bot protection; we use headless Chrome to bypass (first run: ~150MB Chromium download)
- **Self-host option:** Run your own Nitter (no bot protection, faster). See `nitter/NITTER-SETUP.md`. Then set `NITTER_LOCAL=http://localhost:3002`
- Tweet Viewer requires full tweet URL (x.com/username/status/123)
- Not affiliated with Twitter (X Corp.)
