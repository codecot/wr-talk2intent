import { useState } from 'react';
import TransformPanel from './components/TransformPanel';
import ProjectSelector from './components/ProjectSelector';
import FilePanel from './components/FilePanel';

export default function App() {
  const [activeProjectId, setActiveProjectId] = useState('');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Talk2Intent</h1>
        <ProjectSelector activeProjectId={activeProjectId} onSelect={setActiveProjectId} />
      </header>
      <main className="px-4 py-8 space-y-8">
        <TransformPanel projectId={activeProjectId} />
        {activeProjectId && <FilePanel projectId={activeProjectId} />}
      </main>
    </div>
  );
}
