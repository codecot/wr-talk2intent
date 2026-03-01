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
ollama pull llama3.2
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
