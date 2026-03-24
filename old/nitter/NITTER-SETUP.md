# Self-Hosting Nitter (Optional)

Running your own Nitter bypasses "Verifying your browser" — our app can use simple `fetch` instead of Puppeteer. No Chromium, faster.

## Requirements

- Docker & Docker Compose
- A Twitter/X account (for session tokens — Nitter needs this since 2024)

## 1. Create Session Tokens

Nitter needs Twitter session tokens. See [Creating session tokens](https://github.com/zedeus/nitter/wiki/Creating-session-tokens):

```bash
cd twitter-viewer
git clone https://github.com/zedeus/nitter nitter-repo
cd nitter-repo/tools
pip install -r requirements.txt
python3 create_session_browser.py YOUR_TWITTER_USER YOUR_TWITTER_PASSWORD --append ../../nitter/sessions.jsonl
```

This adds a line to `sessions.jsonl` with `auth_token` and `ct0`. You need a real Twitter account.

## 2. Configure

```bash
cd twitter-viewer/nitter
cp nitter.example.conf nitter.conf
# Edit nitter.conf if needed (hostname, etc.)
```

## 3. Run

```bash
docker compose up -d
```

Nitter runs at `http://localhost:3002`.

## 4. Use with Twitter Viewer

Set the env var and restart the server:

```bash
set NITTER_LOCAL=http://localhost:3002
cd server
npm run dev
```

Or in PowerShell:

```powershell
$env:NITTER_LOCAL="http://localhost:3002"
cd server; npm run dev
```

The app will try your local Nitter first (no Puppeteer needed), then fall back to public instances.
