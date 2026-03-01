# Talk2Intent

Local-first, multimodal text transformation system. Converts voice and text into structured intents, summaries, tasks, and polished rewrites using a local LLM (Ollama) and GPU-accelerated speech-to-text (faster-whisper).

## Architecture

```
Browser (React) → Vite dev proxy → Fastify (:3000) → Ollama (LLM + embeddings)
                                         ↓
                                   Python ASR (:8001) ← faster-whisper (GPU)
                                         ↓
                                   SQLite (events + chunks + vectors)
                                         ↓
                                   Vault filesystem (project files)
```

- **UI** — React + Vite + Tailwind CSS
- **Server** — Fastify (Node.js/TypeScript), proxies all API calls
- **ASR** — FastAPI (Python), faster-whisper with CUDA, ffmpeg preprocessing
- **LLM** — Ollama running locally (llama3.2 for generation, nomic-embed-text for embeddings)
- **Vault** — Per-project filesystem (docs, tasks, decisions, notes, assets, context)
- **RAG** — File upload, text chunking, Ollama embeddings, cosine similarity search via SQLite

## Prerequisites

- Node.js 20+
- Python 3.10+
- [Ollama](https://ollama.ai) installed and running
- ffmpeg on PATH
- NVIDIA GPU + CUDA (for ASR; CPU fallback available)

## Ollama Models

```bash
ollama pull llama3.2           # Text generation
ollama pull nomic-embed-text   # Embeddings for RAG
```

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env

# 2. Pull Ollama models
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Start the ASR service
cd asr
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8001 &

# 4. Start the API server
cd ../server
npm install
npm run dev &

# 5. Start the UI
cd ../ui
npm install
npm run dev
```

Open http://localhost:5173 — paste text or use the audio buttons to transcribe, then transform with a preset.

## Project Structure

```
├── asr/                  # Python ASR microservice
│   ├── main.py           # FastAPI app (transcribe endpoint)
│   └── requirements.txt
├── server/               # Node.js API server
│   ├── src/
│   │   ├── config.ts     # Environment config
│   │   ├── server.ts     # Fastify bootstrap
│   │   ├── db/           # SQLite init + schema
│   │   ├── lib/          # Service clients (ollama, asr, embeddings, chunker, scanner)
│   │   └── modules/      # Feature modules
│   │       ├── presets/   # GET /api/presets
│   │       ├── projects/  # CRUD /api/projects
│   │       ├── transform/ # POST /api/transform
│   │       ├── transcribe/# POST /api/transcribe
│   │       └── rag/       # File upload, reindex, semantic query
│   └── data/
│       ├── presets.json   # Preset definitions
│       └── vault/         # Per-project file storage
├── ui/                   # React frontend
│   └── src/
│       ├── components/   # TransformPanel, AudioInput, ProjectSelector, FilePanel
│       └── lib/api.ts    # API client
├── docs/                 # Project documentation
└── .env.example          # Environment variable template
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/presets` | List available transformation presets |
| POST | `/api/transform` | Transform text with a preset (JSON body: `{ presetId, text, projectId? }`) |
| POST | `/api/transcribe` | Transcribe audio file (multipart upload) |
| POST | `/api/projects` | Create a project (JSON body: `{ title }`) |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get a single project |
| POST | `/api/projects/:id/files` | Upload a file to project vault (multipart) |
| POST | `/api/projects/:id/reindex` | Scan vault, chunk, embed, index into SQLite |
| POST | `/api/rag/query` | Semantic search (JSON body: `{ projectId, query, topK? }`) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama service URL |
| `OLLAMA_MODEL` | `llama3.2` | LLM model for transformations |
| `DB_PATH` | `./data/talk2intent.db` | SQLite database path |
| `ASR_URL` | `http://localhost:8001` | ASR microservice URL |
| `WHISPER_MODEL` | `large-v3` | Whisper model size |
| `WHISPER_DEVICE` | `cuda` | Device for inference (`cuda` or `cpu`) |
| `WHISPER_COMPUTE_TYPE` | `float16` | Compute precision (`float16`, `int8`, `float32`) |
| `VAULT_PATH` | `./data/vault` | Per-project file storage root |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Ollama model for embeddings |
| `CHUNK_SIZE` | `1500` | Target characters per text chunk |
| `CHUNK_OVERLAP` | `200` | Overlap characters between chunks |

## Roadmap

See [docs/V0_PROJECT_REQUIREMENTS.md](docs/V0_PROJECT_REQUIREMENTS.md) for the full phased plan:

- **Phase 0** — Core text transform (complete)
- **Phase 1** — Speech-to-text / ASR (complete)
- **Phase 2** — Project spaces / namespaces (complete)
- **Phase 3** — File import and indexing (complete)
- **Phase 4** — RAG (project-aware transform)
- **Phase 5** — Doc impact detector
- **Phase 6** — Screenshot analysis (multimodal)

## License

Private — all rights reserved.
