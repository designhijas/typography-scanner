import React, { useState } from 'react';
import TypeRow from './components/TypeRow';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('http://localhost:4000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-black selection:text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-20 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            A Visual Type Scale
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            Enter a website URL to extract its typography hierarchy.
            We'll generate a visual scale for both desktop and mobile viewports.
          </p>

          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1 block w-full rounded-none border-b-2 border-slate-200 bg-transparent py-3 px-0 text-xl text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:ring-0 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center px-8 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? 'Scanning...' : 'Generate Scale'}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-12" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="grid lg:grid-cols-2 gap-x-20 gap-y-24">
            {/* Desktop Section */}
            <section>
              <div className="mb-8 border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Desktop Typography</h2>
              </div>
              <div className="space-y-0">
                {data.desktop.map((style, index) => (
                  <TypeRow key={`desktop-${index}`} styleData={style} />
                ))}
              </div>
            </section>

            {/* Mobile Section */}
            <section>
              <div className="mb-8 border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Mobile Typography</h2>
              </div>
              <div className="space-y-0">
                {data.mobile.map((style, index) => (
                  <TypeRow key={`mobile-${index}`} styleData={style} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
