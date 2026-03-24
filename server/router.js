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

  // All games (DB + live state merged)
  router.get('/games', (req, res) => {
    if (!db) {
      // Fallback to in-memory if no DB
      return res.json({ games: state.games, lastUpdated: state.lastUpdated });
    }

    // Get all games from DB (includes historical rounds ESPN dropped)
    const dbGames = db.getAllGames();

    // Build a map of DB games, converting DB row format to API format
    const gameMap = new Map();
    for (const row of dbGames) {
      gameMap.set(row.id, {
        id: row.id,
        round: row.round,
        region: row.region,
        network: row.network,
        scheduledAt: row.scheduled_at,
        status: row.status,
        tournament: 'NCAA',
        home: {
          name: row.home_name,
          alias: row.home_alias,
          seed: row.home_seed,
          score: row.home_score,
        },
        away: {
          name: row.away_name,
          alias: row.away_alias,
          seed: row.away_seed,
          score: row.away_score,
        },
        clock: row.clock,
        period: row.period,
      });
    }

    // Overlay live state (fresher scores, clock, status for active games)
    for (const game of state.games) {
      gameMap.set(game.id, game);
    }

    const merged = Array.from(gameMap.values()).sort(
      (a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || '')
    );

    res.json({
      games: merged,
      lastUpdated: state.lastUpdated,
    });
  });

  // Live games only
  router.get('/games/live', (req, res) => {
    res.json({
      games: state.games.filter(g => g.status === 'inprogress' || g.status === 'halftime'),
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

  // Backfill historical games from ESPN by date range
  router.get('/backfill', async (req, res) => {
    if (!db) return res.status(501).json({ error: 'No database configured' });

    const dates = req.query.dates ? req.query.dates.split(',') : [];
    if (dates.length === 0) {
      return res.status(400).json({ error: 'Provide ?dates=20260317,20260318,...' });
    }

    let total = 0;
    const errors = [];

    for (const date of dates) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}&limit=100`;
        const resp = await fetch(url);
        const data = await resp.json();

        // Import the transformer dynamically
        const { transformAndClassify } = await import('./poller.js');

        for (const event of (data.events || [])) {
          const game = transformAndClassify(event);
          if (game && game.tournament === 'NCAA') {
            db.upsertGame(game);
            // Also backfill quarter scores from linescores
            if (game._periods) {
              for (const p of game._periods) {
                db.recordQuarterScore(game.id, p.period, p.homeScore, p.awayScore);
              }
            }
            total++;
          }
        }
      } catch (e) {
        errors.push({ date, error: e.message });
      }
    }

    res.json({ backfilled: total, errors });
  });

  // Health check
  router.get('/health', (req, res) => {
    const dbCount = db ? db.getAllGames().length : 0;
    res.json({
      status: 'ok',
      games: Math.max(state.games.length, dbCount),
      live: state.games.filter(g => g.status === 'inprogress' || g.status === 'halftime').length,
      lastUpdated: state.lastUpdated,
    });
  });

  return router;
}
