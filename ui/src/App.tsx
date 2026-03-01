import TransformPanel from './components/TransformPanel';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Talk2Intent</h1>
      </header>
      <main className="px-4 py-8">
        <TransformPanel />
      </main>
    </div>
  );
}
