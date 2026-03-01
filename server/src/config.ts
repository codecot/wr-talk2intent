import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'llama3.2',
  dbPath: process.env.DB_PATH ?? './data/talk2intent.db',
  asrUrl: process.env.ASR_URL ?? 'http://localhost:8001',
  vaultPath: process.env.VAULT_PATH ?? './data/vault',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'nomic-embed-text',
  chunkSize: parseInt(process.env.CHUNK_SIZE ?? '1500', 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP ?? '200', 10),
};
