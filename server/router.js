import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const channels = JSON.parse(
  readFileSync(join(__dirname, '../data/channels.json'), 'utf-8')
);
const picks = JSON.parse(
  readFileSync(join(__dirname, '../data/picks.json'), 'utf-8')
);

export function createRouter(state, db) {
  const router = Router();

  // All games (current state)
  router.get('/games', (req, res) => {
    res.json({
      games: state.games,
      lastUpdated: state.lastUpdated,
    });
  });

  // Live games only
  router.get('/games/live', (req, res) => {
    res.json({
      games: state.games.filter(g => g.status === 'inprogress'),
      lastUpdated: state.lastUpdated,
    });
  });

  // Channel info for a specific network key
  router.get('/channel/:networkKey', (req, res) => {
    const info = channels.networks[req.params.networkKey];
    if (!info) return res.status(404).json({ error: 'Network not found' });
    res.json(info);
  });

  // All channel mappings
  router.get('/channels', (req, res) => {
    res.json(channels.networks);
  });

  // Single game with quarter history
  router.get('/games/:id', (req, res) => {
    if (!db) return res.status(501).json({ error: 'No database configured' });
    const game = db.getGame(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  });

  // Quarter scores for a game
  router.get('/games/:id/quarters', (req, res) => {
    if (!db) return res.status(501).json({ error: 'No database configured' });
    const quarters = db.getQuarterScores(req.params.id);
    res.json({ gameId: req.params.id, quarters });
  });

  // Bracket picks
  router.get('/picks', (req, res) => {
    res.json(picks);
  });

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      games: state.games.length,
      live: state.games.filter(g => g.status === 'inprogress').length,
      lastUpdated: state.lastUpdated,
    });
  });

  return router;
}
