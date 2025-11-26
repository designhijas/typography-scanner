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
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/scan`, {
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

  const exportToJSON = (viewport) => {
    if (!data) return;

    const styles = viewport === 'desktop' ? data.desktop : data.mobile;
    const allStyles = [...data.desktop, ...data.mobile];

    // Extract unique font families (max 3)
    const fontFamiliesSet = new Set();
    allStyles.forEach(style => {
      const cleanFamily = style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
      fontFamiliesSet.add(cleanFamily);
    });
    const fontFamilies = Array.from(fontFamiliesSet).slice(0, 3);

    // Build the JSON object
    const tokens = {};

    // Add font families
    const familyLabels = ['primary', 'secondary', 'accent'];
    fontFamilies.forEach((family, index) => {
      tokens[`_fontFamilies.${familyLabels[index]}`] = {
        "$type": "fontFamily",
        "$value": family
      };
    });

    // Add font sizes and line heights
    styles.forEach(style => {
      const name = style.name;
      const sizeInPx = Math.round(style.fontSizePx);

      // Font size
      tokens[name] = {
        "$type": "dimension",
        "$value": `${sizeInPx}px`
      };

      // Line height
      const lhPercent = style.lineHeightPx && style.fontSizePx
        ? Math.round((style.lineHeightPx / style.fontSizePx) * 100)
        : 110;

      tokens[`LH-${name}`] = {
        "$type": "dimension",
        "$value": `${lhPercent}%`
      };
    });

    // Download as JSON file
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typography-tokens-${viewport}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <>
            {/* Export Buttons */}
            <div className="mb-8 flex justify-end gap-3">
              <button
                onClick={() => exportToJSON('desktop')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Desktop
              </button>
              <button
                onClick={() => exportToJSON('mobile')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Mobile
              </button>
            </div>

            {/* Font Families Section */}
            {data.fontFamilies && data.fontFamilies.length > 0 && (
              <div className="mb-12 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Font Families Used</h2>
                <div className="flex flex-wrap gap-3">
                  {data.fontFamilies.map((family, index) => (
                    <div key={index} className="px-4 py-2 bg-white border border-slate-200 rounded-md">
                      <span className="text-sm font-medium text-slate-700" style={{ fontFamily: family }}>
                        {family}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}

export default App;
