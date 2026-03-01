import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.js';

const SUBDIRS = ['docs', 'tasks', 'decisions', 'notes', 'assets', 'context'];

export async function ensureProjectDirs(projectId: string): Promise<void> {
  for (const sub of SUBDIRS) {
    await mkdir(join(config.vaultPath, projectId, sub), { recursive: true });
  }
}

export async function writeOutput(
  projectId: string,
  folder: string,
  filename: string,
  content: string,
): Promise<void> {
  const dir = join(config.vaultPath, projectId, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), content, 'utf-8');
}
