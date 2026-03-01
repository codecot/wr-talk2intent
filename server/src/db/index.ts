import Database from 'better-sqlite3';
import { config } from '../config.js';

let db: Database.Database;

export function initDb(): void {
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      preset_id TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      output TEXT NOT NULL,
      output_format TEXT NOT NULL DEFAULT 'text',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export function getDb(): Database.Database {
  return db;
}
