import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createPoller } from './poller.js';
import { createRouter } from './router.js';
import * as db from './db.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Initialize SQLite
db.initDb();

// State shared between poller and router
const state = {
  games: [],
  lastUpdated: null,
};

// Start polling — emits 'scores:update' to all connected clients on changes
const poller = createPoller({
  apiKey: process.env.SPORTRADAR_KEY,
  dataSource: process.env.DATA_SOURCE || 'mock',
  intervalMs: 30_000,
  db,
  onUpdate: (games) => {
    state.games = games;
    state.lastUpdated = new Date().toISOString();
    io.emit('scores:update', { games, lastUpdated: state.lastUpdated });
    console.log(`[poller] pushed update — ${games.length} games, ${games.filter(g => g.status === 'inprogress').length} live`);
  },
});

app.use('/api', createRouter(state, db));

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  // Send current state immediately on connect
  socket.emit('scores:update', { games: state.games, lastUpdated: state.lastUpdated });
  socket.on('disconnect', () => console.log(`[ws] client disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🏀  NCAA Bracket Live server running on http://localhost:${PORT}`);
  console.log(`    Data source: ${process.env.DATA_SOURCE || 'mock'}`);
  console.log(`    Polling every 30s\n`);
  poller.start();
});
