Talk2Intent — Project Requirements Specification
1. Vision

Talk2Intent is a local-first, multimodal project intake and transformation system.

It converts:

Voice

Text

Files

Screenshots (future stage)

into:

Structured intents

Project-aware artifacts

Documentation updates

Tasks

Notes

The system must be:

Local-first

GPU-accelerated (NVIDIA available)

Modular

Project-aware

Extensible

Cloudflare-compatible for UI hosting

2. Architecture Overview
2.1 High-Level Architecture

Browser (UI)
→ Cloudflare Pages (static UI)
→ Cloudflare Worker (/api proxy)
→ Local API (Fastify)
→ ASR (faster-whisper, GPU)
→ LLM (Ollama, GPU)
→ SQLite (metadata)
→ Vault filesystem (project files)
→ Vector store (Qdrant or similar)

3. Phase 0 – Core Text Transform (MVP Foundation)
3.1 Functional Requirements

User can paste text into UI

User can select a preset

System transforms text using local LLM

Output is returned in required format

Output can be copied

Input/output is stored in SQLite history

3.2 API Endpoints
GET /presets

Returns available presets.

POST /transform

Request:

{
  "presetId": "string",
  "text": "string",
  "projectId": "optional"
}

Response:

{
  "presetId": "string",
  "outputFormat": "plain|markdown",
  "output": "string"
}
3.3 Non-Functional

Must use Ollama (local)

Model configurable via environment variable

Must not call external LLM APIs in default mode

4. Phase 1 – Speech to Text (ASR)
4.1 Functional Requirements

Upload audio file (mp3, wav, m4a, webm)

Transcribe using faster-whisper (GPU)

Return plain text

Transcribed text auto-fills textarea

Language auto-detect

4.2 API
POST /transcribe

Multipart file upload

Response:

{
  "id": "uuid",
  "text": "transcribed text"
}
4.3 Technical Requirements

Use faster-whisper

CUDA acceleration required

Use ffmpeg preprocessing (mono 16kHz)

5. Phase 2 – Project Spaces (Namespace System)
5.1 Project Concept

Each input must be associated with a project namespace.

Project structure:

vault/
  <project-id>/
    docs/
    tasks/
    decisions/
    notes/
    assets/
    context/
5.2 Functional Requirements

Create project

List projects

Select active project

Save outputs to namespace folders

Store metadata in SQLite

5.3 Database Schema (Minimum)
projects

id

title

created_at

events

id

project_id

source (voice|text|image)

raw_text

created_at

artifacts

id

event_id

type (task|note|doc_patch|analysis)

content

created_at

6. Phase 3 – File Import and Indexing
6.1 Functional Requirements

Upload files into namespace

Import entire project folder

Scan .md, .txt, .json, .ts, .js

Detect changed files (hash comparison)

Reindex changed files

6.2 Indexing

Split into chunks

Generate embeddings

Store in vector store (Qdrant recommended)

6.3 API
POST /projects/:id/reindex
POST /rag/query
{
  "projectId": "string",
  "query": "string",
  "topK": 5
}
7. Phase 4 – RAG (Project-Aware Transform)
7.1 Functional Requirements

Presets must optionally use project context

Retrieve top-k relevant chunks

Inject retrieved context into LLM prompt

Response must reference context implicitly

Must not hallucinate beyond context

8. Phase 5 – Doc Impact Detector
8.1 Functional Requirements

Given input + project context:

System must:

Detect impacted files

Propose patch in unified diff format

Explain reasoning briefly

8.2 API
POST /doc-impact
{
  "projectId": "string",
  "text": "string"
}

Response:

{
  "filesImpacted": ["path"],
  "patch": "diff",
  "explanation": "string"
}

System must never auto-apply patches without explicit confirmation.

9. Phase 6 – Screenshot Analysis (Multimodal)
9.1 Functional Requirements

Upload image

Select image preset

Analyze using:

Local VLM (future)
OR

Cloud Vision mode (explicit toggle)

Save image to assets namespace

Save analysis to artifacts

9.2 API
POST /analyze/image

Multipart:

file

presetId

projectId

Response:

{
  "analysis": "string",
  "artifacts": []
}
10. Preset System Requirements

Each preset must include:

{
  "id": "string",
  "title": "string",
  "description": "string",
  "outputFormat": "plain|markdown",
  "template": {
    "system": "string",
    "user": "string with {{text}} placeholder"
  },
  "requiresProjectContext": true|false
}

Presets must be loaded from JSON file (not hardcoded).

11. Deployment Requirements
Local

Docker Compose

ollama

local-api

optional qdrant

GPU access enabled

Cloudflare

UI deployed via Pages

Worker proxies /api/* to local API

Optional authentication layer

No compute-heavy workloads on Workers

12. Security Requirements

No external LLM calls by default

Cloud mode must require explicit enable flag

Limit file upload size (50MB max)

Sanitize inputs

Rate limit API

13. Non-Functional Requirements

Modular codebase

TypeScript

Fastify

Clear separation:

intake

transform

rag

project

multimodal

All environment variables documented

Logs must include request ID

14. Definition of Done (MVP)

System is complete when:

Text transform works locally

Audio upload works with GPU ASR

Presets function correctly

Project namespace stores files

RAG retrieves project context

All components run via Docker Compose

UI works locally

Cloudflare deployment works (UI + proxy)
