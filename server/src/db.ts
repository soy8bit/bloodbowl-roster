import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema migration
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rosters (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT DEFAULT '',
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    data TEXT NOT NULL,
    share_id TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_data (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competitions (
    id TEXT PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'league',
    status TEXT NOT NULL DEFAULT 'active',
    data TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competition_members (
    competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (competition_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS competition_rosters (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    original_roster_id TEXT,
    name TEXT NOT NULL,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    coach_name TEXT DEFAULT '',
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competition_matches (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    home_roster_id TEXT NOT NULL REFERENCES competition_rosters(id),
    away_roster_id TEXT NOT NULL REFERENCES competition_rosters(id),
    round TEXT DEFAULT '',
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    entity_type TEXT,
    entity_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// --- Incremental migrations (ALTER TABLE with try/catch for idempotency) ---
// Fail-fast: only "duplicate column name" is expected and silenced.
// Any other error (disk full, corrupt DB, syntax error) crashes the server on startup
// so the problem is visible immediately — not buried in a silent catch.
const migrations: string[] = [
  `ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ''`,
  // plan_until: always store as ISO 8601 UTC, e.g. new Date(ms).toISOString()
  `ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'`,
  `ALTER TABLE users ADD COLUMN plan_until TEXT`,
  `ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`,
  `ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT`,
  // Multi-user competitions: join code for sharing competitions
  `ALTER TABLE competitions ADD COLUMN join_code TEXT`,
  // Scheduling: match status (scheduled vs played)
  `ALTER TABLE competition_matches ADD COLUMN status TEXT DEFAULT 'played'`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch (err: any) {
    const msg: string = err?.message || '';
    if (msg.includes('duplicate column name')) {
      // Expected on subsequent startups — column already exists, nothing to do.
      continue;
    }
    // Unexpected error: log and crash so we notice immediately.
    console.error(`[DB MIGRATION FATAL] ${sql}\n  Error: ${msg}`);
    throw err;
  }
}

// Unique index on join_code (can't use UNIQUE in ALTER TABLE)
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_competitions_join_code ON competitions(join_code) WHERE join_code IS NOT NULL`);

export default db;
