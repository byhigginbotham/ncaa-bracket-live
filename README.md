# NCAA Bracket Live

Real-time NCAA tournament tracker with live scores + YouTube TV channel mapping.

## Stack

- **Server**: Node.js + Express + Socket.io — polls sports API every 30s, pushes diffs to clients
- **Client**: React + Vite — live bracket UI, network badges, YouTube TV deep links
- **Data**: `channels.json` — your manually-curated network → YouTube TV channel map

## Quickstart

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/ncaa-bracket-live.git
cd ncaa-bracket-live

# 2. Server
cd server
cp .env.example .env        # add your API key
npm install
npm run dev

# 3. Client (new terminal)
cd client
npm install
npm run dev
# → http://localhost:5173
```

## Project Structure

```
ncaa-bracket-live/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── poller.js         # Sports API polling service
│   ├── router.js         # REST endpoints
│   └── .env.example
├── client/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── GameCard.jsx
│       │   ├── LivePanel.jsx
│       │   └── BracketView.jsx
│       ├── hooks/
│       │   └── useSocket.js
│       └── data/
│           └── channels.js   # imports from ../../data/channels.json
└── data/
    └── channels.json     # ← edit this to update channel numbers
```

## Sports API

Uses [SportsRadar NCAAMB API](https://developer.sportradar.com/). Free tier = 1 req/sec, plenty for 30s polling.

Set `SPORTRADAR_KEY` in `server/.env`.

If you don't have a key yet, the server falls back to mock data so the client still works.

## YouTube TV Channel Map

Edit `data/channels.json` to update channel numbers for your market. The client reads this at build time — no API needed.

## Roadmap

- [ ] Phase 1: Live scores + channel map (this repo)
- [ ] Phase 2: Sleeper fantasy overlay (highlight your rostered players)
- [ ] Phase 3: Push notifications when your game starts
- [ ] Phase 4: Docker Compose for homelab deployment
