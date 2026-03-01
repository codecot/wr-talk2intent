import { config } from '../config.js';

export interface TranscribeResult {
  text: string;
  language: string;
  languageProbability: number;
  duration: number;
}

export async function transcribeAudio(
  fileBuffer: Buffer,
  filename: string,
): Promise<TranscribeResult> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(fileBuffer)]), filename);

  const res = await fetch(`${config.asrUrl}/transcribe`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'ASR request failed' }));
    throw new Error(body.detail ?? `ASR error: ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.text,
    language: data.language,
    languageProbability: data.language_probability,
    duration: data.duration,
  };
}
