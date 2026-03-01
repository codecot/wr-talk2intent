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

// --- RAG types ---

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

// --- RAG API functions ---

export async function uploadProjectFile(
  projectId: string,
  file: File,
  subfolder?: string,
): Promise<{ relPath: string; sha256: string }> {
  const form = new FormData();
  form.append('file', file);
  if (subfolder) form.append('subfolder', subfolder);

  const res = await fetch(`/api/projects/${projectId}/files`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? 'Upload failed');
  }
  return res.json();
}

export async function reindexProject(
  projectId: string,
): Promise<ReindexResult> {
  const res = await fetch(`/api/projects/${projectId}/reindex`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Reindex failed' }));
    throw new Error(err.error ?? 'Reindex failed');
  }
  return res.json();
}

export async function ragQuery(
  projectId: string,
  query: string,
  topK?: number,
): Promise<QueryResult> {
  const res = await fetch('/api/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, query, ...(topK ? { topK } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Query failed' }));
    throw new Error(err.error ?? 'Query failed');
  }
  return res.json();
}

// --- Transform ---

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
