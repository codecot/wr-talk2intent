import { useState, useEffect } from 'react';
import { getPresets, transform, type Preset } from '../lib/api';
import AudioInput from './AudioInput';

export default function TransformPanel() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPresets()
      .then((p) => {
        setPresets(p);
        if (p.length > 0) setSelectedPreset(p[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleTransform() {
    if (!selectedPreset || !text.trim()) return;
    setLoading(true);
    setError('');
    setOutput('');
    try {
      const result = await transform(selectedPreset, text);
      setOutput(result.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transform failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <label htmlFor="preset" className="block text-sm font-medium text-gray-700">
          Preset
        </label>
        <select
          id="preset"
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.description}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="input-text" className="block text-sm font-medium text-gray-700">
            Input Text
          </label>
          <AudioInput onTranscribed={(t) => setText(t)} disabled={loading} />
        </div>
        <textarea
          id="input-text"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here or use audio input..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <button
        onClick={handleTransform}
        disabled={loading || !text.trim() || !selectedPreset}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Transforming...' : 'Transform'}
      </button>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Output</label>
            <button
              onClick={handleCopy}
              className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
