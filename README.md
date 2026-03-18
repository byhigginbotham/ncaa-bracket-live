# NCAA Bracket Live

Real-time NCAA Tournament tracker with live scores, game clock, half-by-half history, bracket picks tracking, and YouTube TV channel mapping.

## Stack

- **Server**: Node.js + Express + Socket.io + SQLite (better-sqlite3)
- **Client**: React 18 + Vite
- **Data**: ESPN undocumented API (free, no auth required) or SportsRadar NCAAMB (API key required)
- **Deploy**: Docker Compose (nginx + Node.js)

## Quickstart

```bash
# 1. Clone
git clone https://github.com/byhigginbotham/ncaa-bracket-live.git
cd ncaa-bracket-live

# 2. Server
cd server
cp .env.example .env
# Edit .env — set DATA_SOURCE=espn (default, free) or sportradar (needs key)
npm install
npm run dev

# 3. Client (new terminal)
cd client
npm install
npm run dev
# → http://localhost:5173
```

No API key needed for ESPN mode. The server falls back to a 67-game mock bracket if both ESPN and SportsRadar fail.

## Docker Deployment

```bash
cp server/.env.example server/.env
# Edit server/.env — set DATA_SOURCE=espn
docker compose up -d --build
# → http://localhost:8080 (client)
# → http://localhost:3001 (API)
```

## Features

- **Live scores** with game clock (1st Half · 12:34 / 2nd Half · 8:15 / HALF / Final)
- **Smart polling**: 30s during live games, 1min within 1 hour of tipoff, 5min within 4 hours, paused when idle
- **Poll stats**: footer shows poll count, interval, live countdown to next poll
- **SQLite persistence**: game history + half-by-half score breakdown survives server restarts
- **Round tabs**: First Four, Round of 64, Round of 32, Sweet 16, Elite 8, Final Four, Championship
- **Smart date display**: today shows time only, this week shows day + time (Thu 11:15 AM), beyond shows date (3/26 7:10 PM)
- **Bracket picks**: track your picks via `data/picks.json` — gold ★ stars on your teams
- **YouTube TV integration**: network badges show channel numbers (e.g., "ESPN2 · 209")
- **Watch button**: only appears on live and upcoming-today games
- **Halves toggle**: click "Halves" on final games to see H1/H2 score breakdown
- **NCAA vs NIT separation**: filters NIT games out of the main bracket view
- **Dark mode**: follows system preference

## Data Sources

### ESPN (Recommended — `DATA_SOURCE=espn`)

Free, no API key, real-time 2026 data. Uses ESPN's undocumented scoreboard API:

```
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
```

- No rate limit published (30s polling works fine)
- Returns scores, clock, period, linescores (half breakdown), broadcasts
- Fetches all tournament dates (-3 to +21 days) with caching for past dates
- Risk: undocumented API — ESPN can change it at any time

### SportsRadar (`DATA_SOURCE=sportradar`)

Requires API key from [developer.sportradar.com](https://developer.sportradar.com/). Free tier has 1 req/sec rate limit.

- **Gotcha**: free trial tier serves data on a 1-year delay (2025 data when you query 2026 dates)
- Production tier ($500+/month) required for current-year data
- Mixes NCAA Tournament and NIT games on the same schedule endpoint — the app classifies them by title field

### Mock (`DATA_SOURCE=mock`)

67-game mock bracket for development. Scores tick and clock counts down on each poll to simulate live games.

## Project Structure

```
ncaa-bracket-live/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── poller.js         # ESPN/SportsRadar polling + smart interval
│   ├── router.js         # REST endpoints (/api/games, /api/picks, etc.)
│   ├── db.js             # SQLite persistence layer
│   ├── mockBracket.js    # 67-game mock tournament data
│   └── .env.example
├── client/
│   └── src/
│       ├── App.jsx              # Round tabs + picks banner + poll stats
│       ├── components/
│       │   ├── GameCard.jsx     # Score bug with clock, network, halves toggle
│       │   ├── LivePanel.jsx    # Live / Upcoming Today / Finals
│       │   └── BracketView.jsx  # Round view with region grouping
│       ├── hooks/
│       │   └── useSocket.js     # WebSocket + picks + poll stats
│       └── data/
│           └── channels.js
├── data/
│   ├── channels.json    # Network → YouTube TV channel map
│   └── picks.json       # Your bracket picks
└── docker-compose.yml
```

## Bracket Picks

To track your bracket picks:

1. Fill out your bracket on Sleeper (or any app)
2. Screenshot each region of your completed bracket
3. Paste the screenshots into Claude Code
4. Claude reads your picks and updates `data/picks.json` automatically
5. Gold ★ stars appear next to your picked teams

## YouTube TV Channel Map

Edit `data/channels.json` to match your market. Default is Birmingham, AL. Channel numbers show directly on network badges.

## FAQs & Gotchas

**Q: Will I lose scoring data if the server restarts?**
No. ESPN returns linescores (half-by-half points) for all games on each poll. Even if the server was down for an entire game, the next poll after restart picks up the final linescores and writes them to SQLite. The Docker container has `restart: unless-stopped`.

**Q: The app shows "Paused" in the footer — is it broken?**
No. Smart polling pauses when there are no upcoming games (e.g., between game days). It automatically resumes when the next game day approaches (5min polls within 4 hours, 1min within 1 hour, 30s during live games).

**Q: SportsRadar shows wrong teams / last year's data.**
The free trial tier serves data on a 1-year delay. Use `DATA_SOURCE=espn` instead — it's free and has current data.

**Q: ESPN API stopped working / returns errors.**
It's an undocumented API with no SLA. If it goes down, set `DATA_SOURCE=mock` to keep the UI running with simulated data until ESPN comes back.

**Q: NIT games are showing up mixed with NCAA Tournament.**
The SportsRadar API mixes them. The app classifies games by title: "Regional" = NCAA, city-name "Bracket" = NIT. ESPN mode returns NCAA Tournament games only.

**Q: Channel numbers are wrong for my area.**
Edit `data/channels.json`. The defaults are for Birmingham, AL (YouTube TV). Verify at [tv.youtube.com/guide](https://tv.youtube.com/guide).

**Q: Some games show "TBD" for the opponent.**
These are games whose opponent depends on a First Four result or earlier round. The API updates them once the feeder game completes.

**Q: How many API calls does this make?**
Check the footer — it shows poll count, current interval, and countdown. ESPN mode makes 1 call per date per poll cycle (~12 calls for the full tournament). Past dates are cached so only dates with active/upcoming games get re-fetched.

## License

MIT
