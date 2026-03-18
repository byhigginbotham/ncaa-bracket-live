# Setup Guide

## Step 1 — Create the GitHub repo

```bash
# Install GitHub CLI if you don't have it
# https://cli.github.com/

gh repo create ncaa-bracket-live --public --description "Live NCAA bracket tracker with YouTube TV channel mapping"
cd ncaa-bracket-live
```

Or create it manually at github.com/new, then:

```bash
git clone https://github.com/YOUR_USERNAME/ncaa-bracket-live.git
cd ncaa-bracket-live
```

## Step 2 — Copy these files in

Drop the contents of this zip into the cloned folder. Then:

```bash
git add .
git commit -m "Initial scaffold — server + client + channel map"
git push origin main
```

## Step 3 — Open in Claude Code

```bash
# In the project root
claude
```

Claude Code will pick up the repo. Good first prompts to try:
- "Install dependencies in both server and client"
- "Run the server in mock mode and open the client"
- "Add a Sleeper API integration to show my fantasy roster"

## Step 4 — Get a SportsRadar API key (free)

1. Go to https://developer.sportradar.com/
2. Sign up → create a trial app → select "NCAA Men's Basketball v8"
3. Copy your API key
4. `cp server/.env.example server/.env`
5. Paste your key into `server/.env`

Free trial: 1 req/sec, 1000 req/month. The 30s polling uses ~1440 req/day during a full tournament day — upgrade to paid ($9/mo) if needed, or reduce polling to 60s.

## Step 5 — Local dev

```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd client && npm install && npm run dev
# → http://localhost:5173
```

## Step 6 — Homelab deployment (optional)

```bash
# From the project root
cp .env.example .env
# Edit .env with your SPORTRADAR_KEY

docker compose up -d
# Client: http://YOUR_HOMELAB_IP:8080
# Server: http://YOUR_HOMELAB_IP:3001/api/health
```

Add to your Tailscale network and access it from your phone anywhere.

## Updating channel numbers

Edit `data/channels.json`. Channel numbers are market-specific — yours are set for
Birmingham, AL. Verify at https://tv.youtube.com/guide.

```json
"ESPN2": {
  "label": "ESPN2",
  "youtubeTV": {
    "channelNumber": 209,    ← change this if yours differs
    "url": "https://tv.youtube.com"
  }
}
```

No rebuild needed if running in Docker — the file is volume-mounted.

## Phase 2: Sleeper integration

The Sleeper API is free, no auth required for read-only data.

```
GET https://api.sleeper.app/v1/user/{username}
GET https://api.sleeper.app/v1/league/{league_id}/rosters
```

Plan: add a `/api/sleeper/:username` endpoint in `server/router.js` that fetches
your roster, then cross-reference player names against game rosters to highlight
"your guys" on the GameCard.
