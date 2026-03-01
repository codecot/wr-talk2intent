export interface Preset {
  id: string;
  name: string;
  description: string;
}

export interface TransformResult {
  id: string;
  presetId: string;
  output: string;
  createdAt: string;
}

export async function getPresets(): Promise<Preset[]> {
  const res = await fetch('/api/presets');
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function transform(
  presetId: string,
  text: string,
): Promise<TransformResult> {
  const res = await fetch('/api/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetId, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Transform failed' }));
    throw new Error(err.error ?? 'Transform failed');
  }
  return res.json();
}
