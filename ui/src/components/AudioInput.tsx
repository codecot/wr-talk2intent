import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../lib/api';

interface AudioInputProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

export default function AudioInput({ onTranscribed, disabled }: AudioInputProps) {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError('');
      try {
        const result = await transcribeAudio(file, file.name);
        onTranscribed(result.text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transcription failed');
      } finally {
        setLoading(false);
      }
    },
    [onTranscribed],
  );

  function handleUploadClick() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      e.target.value = '';
    }
  }

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecording(false);
        await handleFile(new File([blob], 'recording.webm', { type: 'audio/webm' }));
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access denied');
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  const busy = loading || disabled;

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleUploadClick}
        disabled={busy || recording}
        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && !recording ? 'Transcribing...' : 'Upload Audio'}
      </button>

      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={busy && !recording}
        className={`rounded px-2 py-1 text-xs ${
          recording
            ? 'border border-red-300 text-red-600 hover:bg-red-50'
            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {recording ? 'Stop Recording' : 'Record'}
      </button>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
