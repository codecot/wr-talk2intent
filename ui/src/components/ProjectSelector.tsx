import { useState, useEffect } from 'react';
import { getProjects, createProject, type Project } from '../lib/api';

interface ProjectSelectorProps {
  activeProjectId: string;
  onSelect: (id: string) => void;
}

export default function ProjectSelector({ activeProjectId, onSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load projects'));
  }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setError('');
    try {
      const project = await createProject(newTitle.trim());
      setProjects((prev) => [project, ...prev]);
      onSelect(project.id);
      setNewTitle('');
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeProjectId}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      {creating ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Project name"
            autoFocus
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            className="rounded-md bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewTitle('');
            }}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          New Project
        </button>
      )}

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
