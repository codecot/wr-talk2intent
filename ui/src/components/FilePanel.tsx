import { useState } from 'react';
import {
  uploadProjectFile,
  reindexProject,
  ragQuery,
  type ReindexResult,
  type RagChunk,
} from '../lib/api';

interface FilePanelProps {
  projectId: string;
}

export default function FilePanel({ projectId }: FilePanelProps) {
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState('');
  const [uploading, setUploading] = useState(false);

  // Reindex state
  const [reindexResult, setReindexResult] = useState<ReindexResult | null>(null);
  const [reindexing, setReindexing] = useState(false);

  // Query state
  const [query, setQuery] = useState('');
  const [chunks, setChunks] = useState<RagChunk[]>([]);
  const [querying, setQuerying] = useState(false);

  const [error, setError] = useState('');

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setError('');
    setUploadResult('');
    try {
      const result = await uploadProjectFile(projectId, uploadFile);
      setUploadResult(`Uploaded: ${result.relPath}`);
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleReindex() {
    setReindexing(true);
    setError('');
    setReindexResult(null);
    try {
      const result = await reindexProject(projectId);
      setReindexResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reindex failed');
    } finally {
      setReindexing(false);
    }
  }

  async function handleQuery() {
    if (!query.trim()) return;
    setQuerying(true);
    setError('');
    setChunks([]);
    try {
      const result = await ragQuery(projectId, query, 5);
      setChunks(result.chunks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setQuerying(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Files & RAG</h2>

      {/* Upload section */}
      <div className="space-y-2 rounded-md border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          Upload File
        </label>
        <div className="flex gap-2">
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="flex-1 text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadResult && (
          <p className="text-sm text-green-700">{uploadResult}</p>
        )}
      </div>

      {/* Reindex section */}
      <div className="space-y-2 rounded-md border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          Index Project Files
        </label>
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reindexing ? 'Indexing...' : 'Reindex'}
        </button>
        {reindexResult && (
          <p className="text-sm text-gray-600">
            Added: {reindexResult.added}, Updated: {reindexResult.updated},
            Removed: {reindexResult.removed}, Skipped: {reindexResult.skipped},
            Total chunks: {reindexResult.totalChunks}
          </p>
        )}
      </div>

      {/* Query section */}
      <div className="space-y-2 rounded-md border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          Semantic Search
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Search project files..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleQuery}
            disabled={!query.trim() || querying}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {querying ? 'Searching...' : 'Search'}
          </button>
        </div>
        {chunks.length > 0 && (
          <div className="space-y-3 pt-2">
            {chunks.map((chunk, i) => (
              <div
                key={i}
                className="rounded border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{chunk.filePath} (chunk {chunk.chunkIndex})</span>
                  <span>Score: {chunk.score.toFixed(4)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
