import { randomUUID, createHash } from 'node:crypto';
import { getDb } from '../../db/index.js';
import { config } from '../../config.js';
import { writeOutput } from '../../lib/vault.js';
import { embed, embedSingle, cosineSimilarity } from '../../lib/embeddings.js';
import { chunkText } from '../../lib/chunker.js';
import { scanProjectFiles } from '../../lib/scanner.js';

export interface UploadResult {
  relPath: string;
  sha256: string;
}

export interface ReindexResult {
  added: number;
  updated: number;
  removed: number;
  skipped: number;
  totalChunks: number;
}

export interface RagChunk {
  content: string;
  score: number;
  filePath: string;
  chunkIndex: number;
}

export interface QueryResult {
  chunks: RagChunk[];
}

export async function uploadFile(
  projectId: string,
  filename: string,
  content: Buffer,
  subfolder: string = 'docs',
): Promise<UploadResult> {
  const text = content.toString('utf-8');
  const sha256 = createHash('sha256').update(text).digest('hex');
  const relPath = `${subfolder}/${filename}`;

  await writeOutput(projectId, subfolder, filename, text);

  return { relPath, sha256 };
}

export async function reindexProject(
  projectId: string,
): Promise<ReindexResult> {
  const db = getDb();
  const scanned = await scanProjectFiles(projectId);

  // Load existing indexed files
  const existing = db
    .prepare(`SELECT id, rel_path, sha256 FROM indexed_files WHERE project_id = ?`)
    .all(projectId) as Array<{ id: string; rel_path: string; sha256: string }>;

  const existingMap = new Map(existing.map((r) => [r.rel_path, r]));
  const scannedPaths = new Set(scanned.map((f) => f.relPath));

  let added = 0;
  let updated = 0;
  let removed = 0;
  let skipped = 0;
  let totalChunks = 0;

  // Remove files that no longer exist on disk
  const toRemove = existing.filter((r) => !scannedPaths.has(r.rel_path));
  if (toRemove.length > 0) {
    const deleteChunks = db.prepare(`DELETE FROM chunks WHERE file_id = ?`);
    const deleteFile = db.prepare(`DELETE FROM indexed_files WHERE id = ?`);

    const removeTransaction = db.transaction(() => {
      for (const file of toRemove) {
        deleteChunks.run(file.id);
        deleteFile.run(file.id);
      }
    });
    removeTransaction();
    removed = toRemove.length;
  }

  // Process new and changed files
  const toProcess: Array<{
    relPath: string;
    content: string;
    sha256: string;
    isNew: boolean;
    existingId?: string;
  }> = [];

  for (const file of scanned) {
    const ex = existingMap.get(file.relPath);
    if (ex && ex.sha256 === file.sha256) {
      skipped++;
      continue;
    }
    toProcess.push({
      relPath: file.relPath,
      content: file.content,
      sha256: file.sha256,
      isNew: !ex,
      existingId: ex?.id,
    });
  }

  // Chunk and embed in batches
  for (const file of toProcess) {
    const chunks = chunkText(
      file.content,
      config.chunkSize,
      config.chunkOverlap,
    );

    if (chunks.length === 0) continue;

    // Batch embed all chunks for this file
    const texts = chunks.map((c) => c.content);
    const BATCH_SIZE = 32;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const vectors = await embed(batch);
      allEmbeddings.push(...vectors);
    }

    const fileId = file.existingId ?? randomUUID();

    const upsertFile = db.prepare(`
      INSERT INTO indexed_files (id, project_id, rel_path, sha256, chunk_count, indexed_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(project_id, rel_path) DO UPDATE SET
        sha256 = excluded.sha256,
        chunk_count = excluded.chunk_count,
        indexed_at = excluded.indexed_at
    `);

    const deleteOldChunks = db.prepare(
      `DELETE FROM chunks WHERE file_id = ?`,
    );

    const insertChunk = db.prepare(`
      INSERT INTO chunks (id, file_id, project_id, chunk_index, content, embedding, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const writeTransaction = db.transaction(() => {
      upsertFile.run(fileId, projectId, file.relPath, file.sha256, chunks.length);
      deleteOldChunks.run(fileId);
      for (let i = 0; i < chunks.length; i++) {
        insertChunk.run(
          randomUUID(),
          fileId,
          projectId,
          chunks[i].index,
          chunks[i].content,
          JSON.stringify(allEmbeddings[i]),
        );
      }
    });
    writeTransaction();

    totalChunks += chunks.length;
    if (file.isNew) added++;
    else updated++;
  }

  // Count total chunks in project for the response
  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM chunks WHERE project_id = ?`)
    .get(projectId) as { cnt: number };
  totalChunks = countRow.cnt;

  return { added, updated, removed, skipped, totalChunks };
}

export async function queryProject(
  projectId: string,
  query: string,
  topK: number = 5,
): Promise<QueryResult> {
  const db = getDb();
  const queryVec = await embedSingle(query);

  // Load all chunks for this project
  const rows = db
    .prepare(
      `SELECT c.content, c.embedding, c.chunk_index, f.rel_path
       FROM chunks c
       JOIN indexed_files f ON c.file_id = f.id
       WHERE c.project_id = ?`,
    )
    .all(projectId) as Array<{
    content: string;
    embedding: string;
    chunk_index: number;
    rel_path: string;
  }>;

  const scored: RagChunk[] = rows.map((row) => ({
    content: row.content,
    score: cosineSimilarity(queryVec, JSON.parse(row.embedding)),
    filePath: row.rel_path,
    chunkIndex: row.chunk_index,
  }));

  scored.sort((a, b) => b.score - a.score);

  return { chunks: scored.slice(0, topK) };
}
