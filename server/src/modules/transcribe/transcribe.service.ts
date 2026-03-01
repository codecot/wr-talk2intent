import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/index.js';
import { transcribeAudio as callAsr, type TranscribeResult } from '../../lib/asr.js';

export interface TranscriptionResult {
  id: string;
  text: string;
  language: string;
  duration: number;
  createdAt: string;
}

export async function transcribe(
  fileBuffer: Buffer,
  filename: string,
): Promise<TranscriptionResult> {
  const asr = await callAsr(fileBuffer, filename);

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO events (id, source, preset_id, raw_text, output, output_format, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'voice', '', asr.text, '', 'text', createdAt);

  return {
    id,
    text: asr.text,
    language: asr.language,
    duration: asr.duration,
    createdAt,
  };
}
