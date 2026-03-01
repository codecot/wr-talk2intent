import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/index.js';
import { generate } from '../../lib/ollama.js';
import { getPresetById } from '../presets/presets.service.js';

export interface TransformResult {
  id: string;
  presetId: string;
  output: string;
  createdAt: string;
}

export async function transform(
  presetId: string,
  text: string,
): Promise<TransformResult> {
  const preset = getPresetById(presetId);
  if (!preset) {
    throw new Error(`Preset not found: ${presetId}`);
  }

  const output = await generate(preset.systemPrompt, text);

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO events (id, source, preset_id, raw_text, output, output_format, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'api', presetId, text, output, 'text', createdAt);

  return { id, presetId, output, createdAt };
}
