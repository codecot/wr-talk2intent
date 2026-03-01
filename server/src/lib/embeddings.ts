import { Ollama } from 'ollama';
import { config } from '../config.js';

const ollama = new Ollama({ host: config.ollamaUrl });

export async function embed(
  input: string | string[],
  model: string = config.embeddingModel,
): Promise<number[][]> {
  const response = await ollama.embed({ model, input });
  return response.embeddings;
}

export async function embedSingle(
  text: string,
  model?: string,
): Promise<number[]> {
  const [vector] = await embed(text, model);
  return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
