import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cuda")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")
ASR_MAX_FILE_SIZE = int(os.getenv("ASR_MAX_FILE_SIZE", str(50 * 1024 * 1024)))

ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a", "webm", "ogg", "flac"}

app = FastAPI(title="Talk2Intent ASR")
model: WhisperModel | None = None


@app.on_event("startup")
def startup():
    global model

    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg not found on PATH — install it before starting the ASR service")

    model = WhisperModel(WHISPER_MODEL, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)


@app.get("/health")
def health():
    return {"status": "ok", "model": WHISPER_MODEL}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: .{ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > ASR_MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(raw_bytes)} bytes). Max: {ASR_MAX_FILE_SIZE} bytes",
        )

    with tempfile.TemporaryDirectory() as tmp:
        input_path = Path(tmp) / f"input.{ext}"
        wav_path = Path(tmp) / "input.wav"

        input_path.write_bytes(raw_bytes)

        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(input_path),
                "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
                str(wav_path),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=422, detail=f"ffmpeg conversion failed: {result.stderr[:500]}")

        segments, info = model.transcribe(str(wav_path), beam_size=5, language=None)
        text = " ".join(seg.text.strip() for seg in segments)

    return JSONResponse(
        content={
            "text": text,
            "language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration": round(info.duration, 2),
        }
    )
