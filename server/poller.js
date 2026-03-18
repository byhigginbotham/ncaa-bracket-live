// Poller: fetches scores from SportsRadar NCAAMB API (or mock data)
// and calls onUpdate() only when scores have changed.

import { getMockBracket } from './mockBracket.js';

const SPORTRADAR_BASE = 'https://api.sportradar.com/ncaamb/trial/v8/en';

// Network mapping: SportsRadar broadcast names → our channel keys
const NETWORK_MAP = {
  'ESPN':    'ESPN',
  'ESPN2':   'ESPN2',
  'ESPNU':   'ESPNU',
  'CBS':     'CBS',
  'TBS':     'TBS',
  'TNT':     'TNT',
  'truTV':   'truTV',
  'TruTV':   'truTV',
  'FS1':     'FS1',
  'FS2':     'FS2',
};

function normalizeNetwork(raw) {
  return NETWORK_MAP[raw] || raw || 'TBD';
}

// Transform SportsRadar game object into our simplified shape
function transformGame(g) {
  const home = g.home;
  const away = g.away;
  const broadcast = g.broadcasts?.[0]?.network || 'TBD';

  return {
    id: g.id,
    status: g.status,           // 'scheduled' | 'inprogress' | 'closed' | 'halftime'
    clock: g.clock,
    period: g.period,
    scheduledAt: g.scheduled,
    network: normalizeNetwork(broadcast),
    home: {
      id: home?.id,
      name: home?.name,
      alias: home?.alias,
      score: home?.points ?? null,
      seed: home?.seed ?? null,
    },
    away: {
      id: away?.id,
      name: away?.name,
      alias: away?.alias,
      score: away?.points ?? null,
      seed: away?.seed ?? null,
    },
  };
}

// Quick hash to detect score changes without deep equality
function hashGames(games) {
  return games
    .map(g => `${g.id}:${g.home.score}:${g.away.score}:${g.status}:${g.clock}`)
    .join('|');
}

// ── Mock data (used when DATA_SOURCE=mock or no API key) ──────────────────────
// Full 64-team bracket with realistic schedule — see mockBracket.js
function getMockGames() {
  return getMockBracket();
}

// ── SportsRadar fetcher ───────────────────────────────────────────────────────

// Fetch boxscore for a single game (has scores + period breakdown)
async function fetchBoxscore(gameId, apiKey) {
  const url = `${SPORTRADAR_BASE}/games/${gameId}/boxscore.json?api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

// Cache boxscore results so we don't re-fetch every poll
const boxscoreCache = new Map();

async function fetchFromSportsRadar(apiKey) {
  // Get today's date in YYYY/MM/DD format
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  const url = `${SPORTRADAR_BASE}/games/${dateStr}/schedule.json?api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SportsRadar responded ${res.status}`);
  const data = await res.json();
  const games = (data.games || []).map(transformGame);

  // For closed/inprogress games with null scores, fetch boxscore
  for (const game of games) {
    const needsScores = (game.status === 'closed' && game.home.score === null) ||
                        game.status === 'inprogress' ||
                        game.status === 'halftime';

    if (needsScores) {
      // Check cache (only use for closed games — live games need fresh data)
      if (game.status === 'closed' && boxscoreCache.has(game.id)) {
        const cached = boxscoreCache.get(game.id);
        game.home.score = cached.homeScore;
        game.away.score = cached.awayScore;
        game._periods = cached.periods;
        continue;
      }

      try {
        await new Promise(r => setTimeout(r, 1100)); // respect rate limit
        const box = await fetchBoxscore(game.id, apiKey);
        if (box) {
          game.home.score = box.home?.points ?? null;
          game.away.score = box.away?.points ?? null;
          game.clock = box.clock || game.clock;
          game.period = box.half || game.period;
          // College basketball uses halves, not quarters
          const homeScoring = box.home?.scoring || [];
          const awayScoring = box.away?.scoring || [];
          game._periods = homeScoring.map((h, i) => ({
            period: h.number || (i + 1),
            homeScore: h.points ?? 0,
            awayScore: awayScoring[i]?.points ?? 0,
          }));
          console.log(`[poller] boxscore: ${game.away.alias} ${game.away.score} - ${game.home.score} ${game.home.alias} | ${game.clock} H${game.period}`);

          // Cache closed games permanently, live games for 30s
          if (game.status === 'closed') {
            boxscoreCache.set(game.id, {
              homeScore: game.home.score,
              awayScore: game.away.score,
              periods: game._periods,
            });
          }
        }
      } catch (e) {
        console.error(`[poller] boxscore fetch failed for ${game.id}:`, e.message);
      }
    }
  }

  return games;
}

// ── Poller factory ────────────────────────────────────────────────────────────
export function createPoller({ apiKey, dataSource, intervalMs, onUpdate, db }) {
  let lastHash = null;
  let timer = null;
  let currentInterval = intervalMs;
  const lastPeriodMap = new Map(); // track period per game for quarter recording

  function getSmartInterval(games) {
    const hasLive = games.some(g => g.status === 'inprogress' || g.status === 'halftime');
    if (hasLive) return 30_000; // 30s during live games

    // Check if any game starts within the next hour
    const now = Date.now();
    const soonest = games
      .filter(g => g.status === 'scheduled')
      .map(g => new Date(g.scheduledAt).getTime() - now)
      .filter(ms => ms > 0)
      .sort((a, b) => a - b)[0];

    if (soonest && soonest < 3600_000) return 60_000;   // 1 min if game within 1 hour
    if (soonest && soonest < 14400_000) return 300_000;  // 5 min if game within 4 hours
    return 0; // no polling — no games today or all finished
  }

  function reschedule(games) {
    const newInterval = getSmartInterval(games);
    if (newInterval !== currentInterval) {
      clearInterval(timer);
      currentInterval = newInterval;
      if (newInterval > 0) {
        timer = setInterval(poll, newInterval);
        console.log(`[poller] interval → ${newInterval / 1000}s`);
      } else {
        console.log(`[poller] paused — no upcoming games`);
      }
    }
  }

  async function poll() {
    try {
      let games;
      if (dataSource === 'sportradar' && apiKey && apiKey !== 'your_key_here') {
        games = await fetchFromSportsRadar(apiKey);
      } else {
        games = getMockGames();
      }

      const hash = hashGames(games);
      if (hash !== lastHash) {
        lastHash = hash;
        onUpdate(games);

        // Persist to SQLite
        if (db) {
          db.upsertGames(games);

          // Record quarter scores on period transitions
          for (const game of games) {
            // Backfill period scores from boxscore
            // For closed games: record all halves
            // For live games: only record completed halves (not the current in-progress half)
            if (game._periods && game._periods.length > 0) {
              const currentHalf = game.period || 0;
              for (const p of game._periods) {
                if (game.status === 'closed' || p.period < currentHalf) {
                  db.recordQuarterScore(game.id, p.period, p.homeScore, p.awayScore);
                }
              }
              delete game._periods;
            }

            if (!game.period || game.status === 'scheduled') continue;

            const prevPeriod = lastPeriodMap.get(game.id) || 0;

            // Period changed — record the score for the completed period
            if (game.period > prevPeriod && prevPeriod > 0) {
              db.recordQuarterScore(game.id, prevPeriod, game.home.score, game.away.score);
            }

            // Game just went to halftime — record end of period 1
            if (game.status === 'halftime' && prevPeriod === 1) {
              db.recordQuarterScore(game.id, 1, game.home.score, game.away.score);
            }

            // Game just closed — record the final period
            if (game.status === 'closed' && prevPeriod > 0) {
              db.recordQuarterScore(game.id, game.period || prevPeriod, game.home.score, game.away.score);
            }

            lastPeriodMap.set(game.id, game.period);
          }
        }
      }
      // Adjust polling interval based on game state
      reschedule(games);
    } catch (err) {
      console.error('[poller] fetch error:', err.message);
      onUpdate(getMockGames());
    }
  }

  return {
    start() {
      poll(); // immediate first poll
      timer = setInterval(poll, intervalMs);
    },
    stop() {
      clearInterval(timer);
    },
  };
}
