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

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS indexed_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      rel_path TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      chunk_count INTEGER NOT NULL DEFAULT 0,
      indexed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, rel_path)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_project ON chunks(project_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_id)`);

  try {
    db.exec(`ALTER TABLE events ADD COLUMN project_id TEXT DEFAULT ''`);
  } catch {
    // Column already exists — ignore
  }
}

export function getDb(): Database.Database {
  return db;
}
