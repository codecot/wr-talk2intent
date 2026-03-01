# HOWTO — Talk2Intent Setup & Usage

## 1. System Dependencies

### Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Python 3.10+

```bash
sudo apt install -y python3 python3-venv python3-pip
```

### ffmpeg

```bash
sudo apt install -y ffmpeg
```

### Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2           # Text generation
ollama pull nomic-embed-text   # Embeddings for RAG / semantic search
```

### NVIDIA / CUDA (for ASR GPU acceleration)

Ensure NVIDIA drivers and CUDA toolkit are installed. Verify with:

```bash
nvidia-smi
```

If you don't have a GPU, set `WHISPER_DEVICE=cpu` and `WHISPER_COMPUTE_TYPE=float32` in your `.env`.

---

## 2. Configuration

```bash
cp .env.example .env
```

Edit `.env` as needed. The defaults work if all services run on the same machine.

---

## 3. Starting the ASR Service

```bash
cd asr
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

First startup downloads the Whisper model (~3 GB for `large-v3`). Subsequent starts load from cache.

Verify it's running:

```bash
curl http://localhost:8001/health
# → {"status":"ok","model":"large-v3"}
```

### CPU-only mode

If you don't have an NVIDIA GPU:

```bash
WHISPER_DEVICE=cpu WHISPER_COMPUTE_TYPE=float32 uvicorn main:app --port 8001
```

Or set those values in `.env`.

---

## 4. Starting the API Server

```bash
cd server
npm install
npm run dev
```

The server starts on port 3000 (configurable via `PORT`).

Verify:

```bash
curl http://localhost:3000/api/presets
```

---

## 5. Starting the UI

```bash
cd ui
npm install
npm run dev
```

Opens on http://localhost:5173. The Vite dev server proxies `/api/*` requests to the Fastify server on `:3000`.

---

## 6. Using the Application

### Text Transform

1. Select a preset from the dropdown (Summarize, Extract Tasks, Rewrite)
2. Paste text into the textarea
3. Click **Transform**
4. Copy the output with the **Copy** button

### Audio Upload

1. Click **Upload Audio** next to the "Input Text" label
2. Select an audio file (mp3, wav, m4a, webm, ogg, flac)
3. Wait for transcription — the text fills the textarea automatically
4. Select a preset and click **Transform**

### Microphone Recording

1. Click **Record** — your browser will ask for microphone permission
2. Speak into your microphone
3. Click **Stop Recording** when done
4. Wait for transcription — the text fills the textarea automatically
5. Select a preset and click **Transform**

---

## 7. Testing the ASR Endpoint Directly

```bash
# Via the Python service directly
curl -X POST http://localhost:8001/transcribe -F "file=@path/to/audio.wav"

# Via the Node.js proxy
curl -X POST http://localhost:3000/api/transcribe -F "file=@path/to/audio.wav"
```

Response:

```json
{
  "id": "uuid",
  "text": "transcribed text here",
  "language": "en",
  "duration": 12.34,
  "createdAt": "2026-03-01T12:00:00.000Z"
}
```

---

## 8. Troubleshooting

### ASR service fails to start

- **"ffmpeg not found"** — Install ffmpeg: `sudo apt install ffmpeg`
- **CUDA errors** — Switch to CPU mode (see section 3)
- **Model download hangs** — Check internet connection; faster-whisper downloads from Hugging Face

### Transcription returns empty text

- Ensure the audio file has actual speech content
- Try converting to WAV first: `ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav`

### "502 Bad Gateway" on /api/transcribe

- The ASR service at `:8001` is not running. Start it first.

### UI can't reach the API

- Make sure the Fastify server is running on `:3000`
- The Vite dev proxy only works with `npm run dev`, not production builds

---

## 9. Project Spaces

Projects organize all work into namespaces. Each project gets a vault directory.

### Create a project

In the UI, click the project selector in the header and create a new project. Or via API:

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"My Project"}'
```

### Vault structure

When a project is created, the vault directory is initialized:

```
data/vault/<project-id>/
├── docs/       # Uploaded documents
├── tasks/
├── decisions/
├── notes/      # Transform outputs saved here
├── assets/
└── context/
```

Transform outputs are automatically saved to `notes/` when a project is active.

---

## 10. File Upload and Indexing (RAG)

### Upload a file

Use the **Files & RAG** panel in the UI (appears when a project is selected), or via API:

```bash
curl -X POST http://localhost:3000/api/projects/<project-id>/files \
  -F "file=@path/to/document.md"
```

Files are saved to the project vault under `docs/` by default. Use the `subfolder` field to target a different folder.

### Reindex project files

Scans all supported files (`.md`, `.txt`, `.json`, `.ts`, `.js`) in the project vault, chunks the text, generates embeddings via Ollama (nomic-embed-text), and stores everything in SQLite.

```bash
curl -X POST http://localhost:3000/api/projects/<project-id>/reindex
```

Response:

```json
{
  "added": 3,
  "updated": 0,
  "removed": 0,
  "skipped": 0,
  "totalChunks": 12
}
```

Reindexing is idempotent — unchanged files (same SHA-256 hash) are skipped. Modified files are re-chunked and re-embedded. Deleted files are cleaned up.

### Semantic search

Query indexed chunks using natural language:

```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<project-id>","query":"how does authentication work?","topK":5}'
```

Response:

```json
{
  "chunks": [
    {
      "content": "chunk text...",
      "score": 0.8523,
      "filePath": "docs/auth.md",
      "chunkIndex": 0
    }
  ]
}
```

Chunks are ranked by cosine similarity against the query embedding. Higher scores indicate stronger semantic matches.

### Configuration

Chunking and embedding behavior can be tuned via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_MODEL` | `nomic-embed-text` | Ollama model for embeddings |
| `CHUNK_SIZE` | `1500` | Target characters per chunk |
| `CHUNK_OVERLAP` | `200` | Character overlap between adjacent chunks |

---

## 11. Troubleshooting (continued)

### "502 Embedding service unavailable" on reindex or query

- Ollama is not running. Start it with `ollama serve`.
- The embedding model isn't pulled. Run `ollama pull nomic-embed-text`.
- Check Ollama is reachable: `curl http://localhost:11434/api/tags`

### Reindex returns all zeros

- The project vault has no supported files. Upload files first or place `.md`/`.txt` files in the vault directory.
- Hidden directories and `node_modules` are automatically skipped.
