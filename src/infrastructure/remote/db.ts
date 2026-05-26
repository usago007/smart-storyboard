import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import * as schema from './schema';

const DB_PATH = process.env.SQLITE_DB_PATH || './data/storyboard.db';

function ensureDir() {
  const path = DB_PATH;
  const dir = path.substring(0, path.lastIndexOf('/'));
  if (dir) {
    mkdirSync(dir, { recursive: true });
  }
}

function ensureSettingsColumns(sqlite: Database.Database) {
  const columns = sqlite.prepare("PRAGMA table_info(settings)").all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('mock_delay_ms')) {
    sqlite.exec("ALTER TABLE settings ADD COLUMN mock_delay_ms INTEGER NOT NULL DEFAULT 600");
  }

  if (!columnNames.has('mock_failure_rate')) {
    sqlite.exec("ALTER TABLE settings ADD COLUMN mock_failure_rate INTEGER NOT NULL DEFAULT 0");
  }
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  ensureDir();

  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      session_type TEXT NOT NULL,
      script TEXT NOT NULL,
      duration INTEGER NOT NULL,
      word_count INTEGER,
      scenes_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(token, session_type)
    );

    CREATE TABLE IF NOT EXISTS settings (
      token TEXT PRIMARY KEY,
      language TEXT NOT NULL DEFAULT 'zh',
      theme TEXT NOT NULL DEFAULT 'light',
      mock_delay_ms INTEGER NOT NULL DEFAULT 600,
      mock_failure_rate INTEGER NOT NULL DEFAULT 0
    );
  `);

  ensureSettingsColumns(sqlite);

  return dbInstance;
}

export { schema };
