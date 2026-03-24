// SQLite persistence layer for game scores and quarter history
import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use /app/db/ volume if available (Docker), fallback to local dir
import { existsSync, mkdirSync } from 'fs';
const DB_DIR = existsSync('/app/db') ? '/app/db' : __dirname;
const DB_PATH = join(DB_DIR, 'bracket.db');

let db;

export function initDb() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      round TEXT,
      region TEXT,
      network TEXT,
      scheduled_at TEXT,
      status TEXT,
      home_name TEXT,
      home_alias TEXT,
      home_seed INTEGER,
      home_score INTEGER,
      away_name TEXT,
      away_alias TEXT,
      away_seed INTEGER,
      away_score INTEGER,
      clock TEXT,
      period INTEGER,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quarter_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL REFERENCES games(id),
      period INTEGER NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      recorded_at TEXT,
      UNIQUE(game_id, period)
    );
  `);

  console.log(`[db] initialized at ${DB_PATH}`);
  return db;
}

const upsertStmt = () => db.prepare(`
  INSERT OR REPLACE INTO games
    (id, round, region, network, scheduled_at, status,
     home_name, home_alias, home_seed, home_score,
     away_name, away_alias, away_seed, away_score,
     clock, period, updated_at)
  VALUES
    (@id, @round, @region, @network, @scheduledAt, @status,
     @homeName, @homeAlias, @homeSeed, @homeScore,
     @awayName, @awayAlias, @awaySeed, @awayScore,
     @clock, @period, @updatedAt)
`);

export function upsertGame(game) {
  upsertStmt().run({
    id: game.id,
    round: game.round || null,
    region: game.region || null,
    network: game.network || null,
    scheduledAt: game.scheduledAt || null,
    status: game.status || null,
    homeName: game.home?.name || null,
    homeAlias: game.home?.alias || null,
    homeSeed: game.home?.seed ?? null,
    homeScore: game.home?.score ?? null,
    awayName: game.away?.name || null,
    awayAlias: game.away?.alias || null,
    awaySeed: game.away?.seed ?? null,
    awayScore: game.away?.score ?? null,
    clock: game.clock || null,
    period: game.period ?? null,
    updatedAt: new Date().toISOString(),
  });
}

const recordQuarterStmt = () => db.prepare(`
  INSERT OR IGNORE INTO quarter_scores (game_id, period, home_score, away_score, recorded_at)
  VALUES (@gameId, @period, @homeScore, @awayScore, @recordedAt)
`);

export function recordQuarterScore(gameId, period, homeScore, awayScore) {
  recordQuarterStmt().run({
    gameId,
    period,
    homeScore,
    awayScore,
    recordedAt: new Date().toISOString(),
  });
}

export function getQuarterScores(gameId) {
  return db.prepare(`
    SELECT period, home_score, away_score, recorded_at
    FROM quarter_scores
    WHERE game_id = ?
    ORDER BY period
  `).all(gameId);
}

export function getGame(gameId) {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return null;
  const quarters = getQuarterScores(gameId);
  return { ...game, quarters };
}

export function getAllGames() {
  return db.prepare('SELECT * FROM games ORDER BY scheduled_at').all();
}

// Batch upsert for efficiency (one transaction per poll cycle)
export function upsertGames(games) {
  const upsert = upsertStmt();
  const txn = db.transaction((gamesList) => {
    for (const game of gamesList) {
      upsert.run({
        id: game.id,
        round: game.round || null,
        region: game.region || null,
        network: game.network || null,
        scheduledAt: game.scheduledAt || null,
        status: game.status || null,
        homeName: game.home?.name || null,
        homeAlias: game.home?.alias || null,
        homeSeed: game.home?.seed ?? null,
        homeScore: game.home?.score ?? null,
        awayName: game.away?.name || null,
        awayAlias: game.away?.alias || null,
        awaySeed: game.away?.seed ?? null,
        awayScore: game.away?.score ?? null,
        clock: game.clock || null,
        period: game.period ?? null,
        updatedAt: new Date().toISOString(),
      });
    }
  });
  txn(games);
}
