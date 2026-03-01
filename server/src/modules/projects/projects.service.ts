import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/index.js';
import { ensureProjectDirs } from '../../lib/vault.js';

export interface Project {
  id: string;
  title: string;
  createdAt: string;
}

export async function createProject(title: string): Promise<Project> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO projects (id, title, created_at) VALUES (?, ?, ?)`,
  ).run(id, title, createdAt);

  await ensureProjectDirs(id);

  return { id, title, createdAt };
}

export function listProjects(): Project[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, title, created_at FROM projects ORDER BY created_at DESC`)
    .all() as Array<{ id: string; title: string; created_at: string }>;

  return rows.map((r) => ({ id: r.id, title: r.title, createdAt: r.created_at }));
}

export function getProjectById(id: string): Project | undefined {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, title, created_at FROM projects WHERE id = ?`)
    .get(id) as { id: string; title: string; created_at: string } | undefined;

  if (!row) return undefined;
  return { id: row.id, title: row.title, createdAt: row.created_at };
}
