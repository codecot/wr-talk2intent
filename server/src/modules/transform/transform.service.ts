import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/index.js';
import { generate } from '../../lib/ollama.js';
import { writeOutput } from '../../lib/vault.js';
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
  projectId?: string,
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
    `INSERT INTO events (id, source, preset_id, raw_text, output, output_format, created_at, project_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'api', presetId, text, output, 'text', createdAt, projectId ?? '');

  if (projectId) {
    const ts = createdAt.replace(/[:.]/g, '-');
    const filename = `${ts}_${presetId}_${id}.md`;
    await writeOutput(projectId, 'notes', filename, output);
  }

  return { id, presetId, output, createdAt };
}
