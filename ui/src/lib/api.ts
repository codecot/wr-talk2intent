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

export interface Project {
  id: string;
  title: string;
  createdAt: string;
}

export async function getPresets(): Promise<Preset[]> {
  const res = await fetch('/api/presets');
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(title: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create project' }));
    throw new Error(err.error ?? 'Failed to create project');
  }
  return res.json();
}

export interface TranscribeResult {
  id: string;
  text: string;
  language: string;
  duration: number;
  createdAt: string;
}

export async function transcribeAudio(
  file: Blob,
  filename: string,
  projectId?: string,
): Promise<TranscribeResult> {
  const form = new FormData();
  form.append('file', file, filename);
  if (projectId) form.append('projectId', projectId);

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(err.error ?? 'Transcription failed');
  }
  return res.json();
}

export async function transform(
  presetId: string,
  text: string,
  projectId?: string,
): Promise<TransformResult> {
  const res = await fetch('/api/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetId, text, ...(projectId ? { projectId } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Transform failed' }));
    throw new Error(err.error ?? 'Transform failed');
  }
  return res.json();
}
