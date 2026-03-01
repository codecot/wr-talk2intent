import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Preset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const presetsPath = resolve(__dirname, '../../../data/presets.json');

let presetsCache: Preset[] | null = null;

export function getPresets(): Preset[] {
  if (!presetsCache) {
    const raw = readFileSync(presetsPath, 'utf-8');
    presetsCache = JSON.parse(raw) as Preset[];
  }
  return presetsCache;
}

export function getPresetById(id: string): Preset | undefined {
  return getPresets().find((p) => p.id === id);
}
