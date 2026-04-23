# Talk2Intent

## What this project does

Talk2Intent is a local-first, multimodal text transformation system. It turns
voice and text input into structured intents, summaries, tasks, and rewrites
using a local LLM via Ollama and GPU-accelerated speech-to-text via
faster-whisper, with per-project file vaults and semantic search over indexed
content.

## Main technologies

- **UI** — React 19, Vite 7, Tailwind CSS 4, TypeScript
- **API server** — Node.js 20+, Fastify 5, TypeScript (run via `tsx`),
  better-sqlite3
- **ASR microservice** — Python 3.10+, FastAPI, uvicorn, faster-whisper (CUDA),
  ffmpeg
- **LLM / embeddings** — Ollama (`llama3.2`, `nomic-embed-text`)
- **Storage** — SQLite for events, chunks, and vector rows; on-disk vault
  filesystem for per-project files

## Project structure

- `asr/` — Python FastAPI microservice wrapping faster-whisper (transcribe
  endpoint, GPU inference).
- `server/` — Fastify API server. `src/db/` holds SQLite schema, `src/lib/`
  holds service clients (ollama, asr, embeddings, chunker, scanner), and
  `src/modules/` holds feature modules (`presets`, `projects`, `transform`,
  `transcribe`, `rag`).
- `server/data/` — runtime data: `presets.json` definitions and the per-project
  `vault/` file storage.
- `ui/` — React + Vite frontend. `src/components/` contains the panels
  (`TransformPanel`, `AudioInput`, `ProjectSelector`, `FilePanel`); `src/lib/
  api.ts` is the API client.
- `docs/` — project requirements and design notes.
- `specs/` — task specifications.
- `.env.example` — template for environment variables consumed by the server.

## How to run locally

```bash
# 1. Clone and configure
git clone <repo-url> wr-talk2intent
cd wr-talk2intent
cp .env.example .env

# 2. Pull Ollama models (Ollama must be installed and running)
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Start the ASR microservice (requires Python 3.10+, ffmpeg on PATH,
#    and an NVIDIA GPU with CUDA for float16; CPU fallback is possible
#    via WHISPER_DEVICE=cpu)
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

Open http://localhost:5173. The Vite dev server proxies API calls to the
Fastify server on port 3000, which in turn talks to Ollama (11434) and the
ASR service (8001).

## How to deploy

No deploy story is defined. The project is designed to run locally against a
user's own Ollama instance and GPU; there are no Dockerfiles, CI workflows,
hosting configs, or deploy scripts in the repo.

## Key external dependencies

- **Ollama** (`http://localhost:11434` by default) — local LLM runtime serving
  the generation model (`llama3.2`) and the embedding model
  (`nomic-embed-text`).
- **faster-whisper** — speech-to-text model loaded by the ASR microservice;
  requires CUDA + ffmpeg for the default configuration.
- **SQLite** (via `better-sqlite3`) — embedded database used for events,
  chunks, and vector storage.
- **Local filesystem vault** — per-project file storage rooted at
  `VAULT_PATH` (default `./data/vault`).
