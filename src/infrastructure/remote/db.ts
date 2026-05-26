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
      theme TEXT NOT NULL DEFAULT 'light'
    );
  `);

  return dbInstance;
}

export { schema };
