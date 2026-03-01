import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { config } from '../config.js';

const ALLOWED_EXTENSIONS = new Set(['.md', '.txt', '.json', '.ts', '.js']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.DS_Store']);

export interface ScannedFile {
  relPath: string;
  absPath: string;
  sha256: string;
  content: string;
}

export async function scanProjectFiles(
  projectId: string,
): Promise<ScannedFile[]> {
  const root = join(config.vaultPath, projectId);
  const files: ScannedFile[] = [];
  await walk(root, root, files);
  return files;
}

async function walk(
  dir: string,
  root: string,
  results: ScannedFile[],
): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // Directory doesn't exist yet
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;

    const absPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(absPath, root, results);
    } else if (entry.isFile()) {
      const ext = entry.name.slice(entry.name.lastIndexOf('.'));
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const content = await readFile(absPath, 'utf-8');
      const sha256 = createHash('sha256').update(content).digest('hex');
      const relPath = relative(root, absPath);

      results.push({ relPath, absPath, sha256, content });
    }
  }
}
