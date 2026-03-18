# NCAA Bracket Live

Real-time NCAA tournament tracker with live scores, game clock, half-by-half history, bracket picks tracking, and YouTube TV channel mapping.

## Requirements

**You need your own SportsRadar API key.** This repo does not include one.

1. Sign up at [developer.sportradar.com](https://developer.sportradar.com/)
2. Create an app and select **NCAA Men's Basketball (NCAAMB)**
3. Copy your API key into `server/.env` (see Quickstart below)

Free tier: 1 req/sec, 1,000 req/month. No API key? The server falls back to a 67-game mock bracket so you can still develop and test.

## Stack

- **Server**: Node.js + Express + Socket.io + SQLite (better-sqlite3)
- **Client**: React 18 + Vite
- **API**: SportsRadar NCAAMB v8 (schedule + boxscore endpoints)
- **Deploy**: Docker Compose (nginx + Node.js)

## Quickstart

```bash
# 1. Clone
git clone https://github.com/byhigginbotham/ncaa-bracket-live.git
cd ncaa-bracket-live

# 2. Server
cd server
cp .env.example .env        # edit this — add YOUR SportsRadar key
npm install
npm run dev

# 3. Client (new terminal)
cd client
npm install
npm run dev
# → http://localhost:5173
```

## Docker Deployment

```bash
cp server/.env.example server/.env   # add your API key
docker compose up -d --build
# → http://localhost:8080
```

## Features

- **Live scores** with game clock (1st Half / 2nd Half / HALF / Final)
- **Smart polling**: 30s during live games, 1min within an hour of tipoff, 5min otherwise, paused when idle
- **SQLite persistence**: game history + half-by-half score breakdown survives restarts
- **Round tabs**: First Four, Round of 64, Round of 32, Sweet 16, Elite 8, Final Four, Championship
- **Bracket picks**: track your picks via `data/picks.json` — gold stars on your teams
- **YouTube TV integration**: network badges show channel numbers (customizable per market)
- **Dark mode**: follows system preference
- **67-game mock bracket**: full tournament simulation for development

## Project Structure

```
ncaa-bracket-live/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── poller.js         # SportsRadar polling + boxscore fetching
│   ├── router.js         # REST endpoints (/api/games, /api/picks, etc.)
│   ├── db.js             # SQLite persistence layer
│   ├── mockBracket.js    # 67-game mock tournament data
│   └── .env.example
├── client/
│   └── src/
│       ├── App.jsx              # Round tabs + picks banner
│       ├── components/
│       │   ├── GameCard.jsx     # Score bug with clock, network, halves toggle
│       │   ├── LivePanel.jsx    # Live / Upcoming / Final sections
│       │   └── BracketView.jsx  # Round view with region grouping
│       ├── hooks/
│       │   └── useSocket.js     # WebSocket + picks loading
│       └── data/
│           └── channels.js
├── data/
│   ├── channels.json    # Network → YouTube TV channel map (edit for your market)
│   └── picks.json       # Your bracket picks (screenshot Sleeper → Claude generates)
└── docker-compose.yml
```

## Bracket Picks

To track your bracket picks:

1. Fill out your bracket on Sleeper (or any app)
2. Screenshot each region
3. Paste screenshots into Claude Code — it reads your picks and generates `data/picks.json`
4. Gold ★ stars appear next to your picked teams

## YouTube TV Channel Map

Edit `data/channels.json` to match your market. Default is Birmingham, AL. The channel numbers show directly on network badges (e.g., "ESPN2 · 209").

## API Notes

- Schedule endpoint returns game list but **not** live scores or clock
- Boxscore endpoint (per-game) provides scores, clock, half, and period breakdown
- Free tier rate limit: 1 req/sec — the smart poller respects this with 1.1s delays between boxscore fetches
- At 30s polling with 4 live games, expect ~500 requests per game day

## License

MIT
