// Poller: fetches scores from SportsRadar NCAAMB API (or mock data)
// and calls onUpdate() only when scores have changed.

import { getMockBracket } from './mockBracket.js';

const SPORTRADAR_BASE = 'https://api.sportradar.com/ncaamb/trial/v8/en';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball';

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

// Classify tournament and round from SportsRadar title field
function classifyGame(title) {
  if (!title) return { tournament: 'unknown', round: null, region: null };

  const t = title.toLowerCase();

  // NCAA Tournament uses "Regional" in titles (East Regional, South Regional, etc.)
  // NCAA First Four uses "First Four" in title
  // NIT uses city-name "Bracket" (Auburn Bracket, Tulsa Bracket, Wake Forest Bracket, New Mexico Bracket)
  const NCAA_REGIONS = ['east', 'west', 'south', 'midwest'];
  const isNCAA = NCAA_REGIONS.some(r => t.includes(r + ' regional')) || t.includes('first four') || t.includes('final four') || t.includes('championship');
  const isNIT = !isNCAA && t.includes('bracket');

  if (isNIT) {
    let nitRound = null;
    if (t.includes('first round')) nitRound = 'NIT First Round';
    else if (t.includes('second round')) nitRound = 'NIT Second Round';
    else if (t.includes('quarterfinal')) nitRound = 'NIT Quarterfinal';
    else if (t.includes('semifinal')) nitRound = 'NIT Semifinal';
    else if (t.includes('championship') || t.includes('final')) nitRound = 'NIT Championship';
    else nitRound = 'NIT';

    const bracketMatch = title.match(/^(.+?)\s*Bracket/i);
    const nitRegion = bracketMatch ? bracketMatch[1] : null;

    return { tournament: 'NIT', round: nitRound, region: nitRegion };
  }

  // NCAA Tournament
  let round = null;
  if (t.includes('first four')) round = 'First Four';
  else if (t.includes('first round')) round = 'First Round';
  else if (t.includes('second round')) round = 'Second Round';
  else if (t.includes('sweet 16') || t.includes('regional semifinal')) round = 'Sweet 16';
  else if (t.includes('elite 8') || t.includes('elite eight') || t.includes('regional final')) round = 'Elite 8';
  else if (t.includes('final four') || t.includes('national semifinal')) round = 'Final Four';
  else if (t.includes('championship') || t.includes('national final')) round = 'Championship';

  // Extract NCAA region
  let region = null;
  const regionMatch = title.match(/(East|West|South|Midwest)\s*Regional/i);
  if (regionMatch) region = regionMatch[1];

  return {
    tournament: round ? 'NCAA' : 'unknown',
    round,
    region,
  };
}

// Transform SportsRadar game object into our simplified shape
function transformGame(g) {
  const home = g.home;
  const away = g.away;
  const broadcast = g.broadcasts?.[0]?.network || 'TBD';
  const { tournament, round, region } = classifyGame(g.title);

  return {
    id: g.id,
    status: g.status,           // 'scheduled' | 'inprogress' | 'closed' | 'halftime'
    clock: g.clock,
    period: g.period,
    scheduledAt: g.scheduled,
    network: normalizeNetwork(broadcast),
    tournament,                  // 'NCAA' | 'NIT' | 'unknown'
    round,                       // 'First Four' | 'First Round' | 'Second Round' | etc.
    region,                      // 'East' | 'South' | 'Auburn Bracket' | etc.
    title: g.title || null,
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

// ── ESPN API fetcher ────────────────────────────────────────────────────────
function transformESPNGame(event) {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const statusObj = comp.status || event.status || {};
  const statusType = statusObj.type?.name || '';
  let status = 'scheduled';
  if (statusType === 'STATUS_IN_PROGRESS') status = 'inprogress';
  else if (statusType === 'STATUS_HALFTIME') status = 'halftime';
  else if (statusType === 'STATUS_FINAL') status = 'closed';
  else if (statusType === 'STATUS_END_PERIOD') status = 'inprogress';

  const clock = statusObj.displayClock || null;
  const period = statusObj.period || null;

  // Competitors: home vs away
  const teams = comp.competitors || [];
  const homeTeam = teams.find(t => t.homeAway === 'home') || teams[0];
  const awayTeam = teams.find(t => t.homeAway === 'away') || teams[1];

  const broadcast = comp.broadcasts?.[0]?.names?.[0] || comp.geoBroadcasts?.[0]?.media?.shortName || 'TBD';

  // Classify tournament from notes/groups
  const notes = comp.notes?.map(n => n.headline || '').join(' ') || '';
  const groups = event.competitions?.[0]?.groups?.name || '';
  const season = event.season?.slug || '';
  let tournament = 'unknown';
  let round = null;
  let region = null;

  const notesLower = (notes + ' ' + groups).toLowerCase();
  if (notesLower.includes('nit') || season.includes('nit')) {
    tournament = 'NIT';
    if (notesLower.includes('first round')) round = 'NIT First Round';
    else if (notesLower.includes('second round')) round = 'NIT Second Round';
    else round = 'NIT';
  } else {
    tournament = 'NCAA';
    if (notesLower.includes('first four')) round = 'First Four';
    else if (notesLower.includes('1st round') || notesLower.includes('first round')) round = 'First Round';
    else if (notesLower.includes('2nd round') || notesLower.includes('second round')) round = 'Second Round';
    else if (notesLower.includes('sweet 16')) round = 'Sweet 16';
    else if (notesLower.includes('elite 8') || notesLower.includes('elite eight')) round = 'Elite 8';
    else if (notesLower.includes('final four')) round = 'Final Four';
    else if (notesLower.includes('championship')) round = 'Championship';

    const regionMatch = notes.match(/(East|West|South|Midwest)/i);
    if (regionMatch) region = regionMatch[1];
  }

  return {
    id: event.id,
    status,
    clock,
    period,
    scheduledAt: event.date || comp.date,
    network: normalizeNetwork(broadcast),
    tournament,
    round,
    region,
    title: notes || event.shortName || null,
    home: {
      id: homeTeam?.id,
      name: homeTeam?.team?.displayName || homeTeam?.team?.name,
      alias: homeTeam?.team?.abbreviation,
      score: homeTeam?.score ? parseInt(homeTeam.score) : null,
      seed: homeTeam?.curatedRank?.current || null,
    },
    away: {
      id: awayTeam?.id,
      name: awayTeam?.team?.displayName || awayTeam?.team?.name,
      alias: awayTeam?.team?.abbreviation,
      score: awayTeam?.score ? parseInt(awayTeam.score) : null,
      seed: awayTeam?.curatedRank?.current || null,
    },
    // ESPN provides linescores (points per half)
    _periods: (homeTeam?.linescores || []).map((ls, i) => ({
      period: i + 1,
      homeScore: parseInt(ls.value) || 0,
      awayScore: parseInt(awayTeam?.linescores?.[i]?.value) || 0,
    })),
  };
}

async function fetchFromESPN() {
  const allGames = [];
  const now = new Date();

  // Fetch tournament dates
  const dates = [];
  // Scan from 3 days ago to 21 days ahead to cover full tournament
  for (let d = -3; d <= 21; d++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    dates.push(dt.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  // ESPN scoreboard can take a dates param
  for (const dateStr of dates) {
    try {
      const url = `${ESPN_BASE}/scoreboard?dates=${dateStr}&groups=100&limit=100`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const events = data.events || [];
      for (const event of events) {
        const game = transformESPNGame(event);
        if (game) allGames.push(game);
      }
    } catch (e) {
      // skip failed dates
    }
  }

  // Deduplicate by ID
  const seen = new Set();
  return allGames.filter(g => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
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

// Tournament date range: First Four through Championship
const TOURNAMENT_DATES = [
  // First Four
  '2026/03/17', '2026/03/18',
  // Round of 64
  '2026/03/19', '2026/03/20',
  // Round of 32
  '2026/03/21', '2026/03/22',
  // Sweet 16
  '2026/03/27', '2026/03/28',
  // Elite 8
  '2026/03/29', '2026/03/30',
  // Final Four
  '2026/04/04',
  // Championship
  '2026/04/06',
];

// Cache schedule responses for dates with no live games (don't re-fetch past days every poll)
const scheduleCache = new Map();

async function fetchFromSportsRadar(apiKey) {
  const allGames = [];

  for (const dateStr of TOURNAMENT_DATES) {
    // Use cache for past dates (all games closed)
    if (scheduleCache.has(dateStr)) {
      allGames.push(...scheduleCache.get(dateStr));
      continue;
    }

    await new Promise(r => setTimeout(r, 1100)); // rate limit
    const url = `${SPORTRADAR_BASE}/games/${dateStr}/schedule.json?api_key=${apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`[poller] schedule ${dateStr}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const dayGames = (data.games || []).map(transformGame);

      // Cache if all games on this date are closed or scheduled (no live games)
      const allDone = dayGames.length > 0 && dayGames.every(g => g.status === 'closed');
      if (allDone) {
        scheduleCache.set(dateStr, dayGames);
      }

      allGames.push(...dayGames);
    } catch (e) {
      console.error(`[poller] schedule ${dateStr} error:`, e.message);
    }
  }

  const games = allGames;

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
      if (dataSource === 'espn') {
        games = await fetchFromESPN();
      } else if (dataSource === 'sportradar' && apiKey && apiKey !== 'your_key_here') {
        games = await fetchFromSportsRadar(apiKey);
      } else {
        games = getMockGames();
      }

      // Always persist period data to DB (ESPN provides linescores inline, no extra cost)
      if (db) {
        for (const game of games) {
          if (game._periods && game._periods.length > 0) {
            const currentHalf = game.period || 0;
            for (const p of game._periods) {
              if (game.status === 'closed' || p.period < currentHalf) {
                db.recordQuarterScore(game.id, p.period, p.homeScore, p.awayScore);
              }
            }
          }
        }
      }

      const hash = hashGames(games);
      if (hash !== lastHash) {
        lastHash = hash;
        onUpdate(games);

        // Persist game state to SQLite
        if (db) {
          db.upsertGames(games);
        }

          // Record scores on period transitions (for SportsRadar boxscore path)
          for (const game of games) {
            delete game._periods; // don't send to client

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
