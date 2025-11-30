import React from 'react';
import { Link } from 'react-router-dom';

const ApiDocs = () => {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-black selection:text-white">
            <div className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
                {/* Header */}
                <div className="mb-16">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Scanner
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                        API Documentation
                    </h1>
                    <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
                        Integrate our typography extraction engine directly into your applications.
                        Scan any website and get a complete visual type scale in JSON format.
                    </p>
                </div>

                {/* Endpoint Section */}
                <div className="space-y-16">
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded text-sm tracking-wide">POST</span>
                            <code className="text-xl font-mono text-slate-900">/api/scan</code>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Scrapes a given URL (and optionally its navigation links) to extract a comprehensive design system including typography, colors, spacing, borders, and components.
                        </p>

                        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                                <span className="text-xs font-mono text-slate-400">Request Body</span>
                                <span className="text-xs font-mono text-slate-500">application/json</span>
                            </div>
                            <div className="p-6 overflow-x-auto">
                                <pre className="text-sm font-mono text-blue-300">
                                    {`{
  "url": "https://example.com",
  "scanMultiplePages": true  // Optional: Scans homepage + up to 19 nav pages
}`}
                                </pre>
                            </div>
                        </div>
                    </section>

                    {/* Example Usage */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Example Usage</h2>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">cURL</h3>
                                <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-lg">
                                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                                        {`curl -X POST https://typography-scanner.vercel.app/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://apple.com", "scanMultiplePages": true}'`}
                                    </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">JavaScript (Fetch)</h3>
                                <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-lg">
                                    <pre className="text-sm font-mono text-slate-300">
                                        {`const response = await fetch('https://typography-scanner.vercel.app/api/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://apple.com',
    scanMultiplePages: true
  })
});

const data = await response.json();
console.log(data);`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Response Format */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Response Format</h2>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                            <ul className="space-y-4 text-slate-600">
                                <li className="flex gap-3">
                                    <span className="font-mono text-sm font-bold text-slate-900 min-w-[120px]">typography</span>
                                    <span>Object containing desktop and mobile type scales, plus font families.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-mono text-sm font-bold text-slate-900 min-w-[120px]">colors</span>
                                    <span>Palette, backgrounds, text colors, borders, and gradients.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-mono text-sm font-bold text-slate-900 min-w-[120px]">components</span>
                                    <span>Extracted buttons and input fields (text, select, checkbox, etc.) with states.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-mono text-sm font-bold text-slate-900 min-w-[120px]">spacing</span>
                                    <span>Common gaps and container widths.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-mono text-sm font-bold text-slate-900 min-w-[120px]">scannedPages</span>
                                    <span>Total number of pages analyzed.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Sample Response */}
                        <div className="mt-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Sample JSON Response</h3>
                            <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-lg">
                                <pre className="text-sm font-mono text-green-300">
                                    {`{
  "typography": {
    "desktop": [
      {
        "name": "Display",
        "fontFamily": "Inter, sans-serif",
        "fontSize": "72px",
        "fontWeight": "700",
        "color": "rgb(15, 23, 42)"
      }
    ],
    "mobile": [],
    "fontFamilies": ["Inter", "Roboto"]
  },
  "colors": {
    "palette": ["#0F172A", "#3B82F6", "#FFFFFF"],
    "backgrounds": ["#FFFFFF", "#F8FAFC"],
    "text": ["#0F172A", "#64748B"]
  },
  "components": {
    "buttons": [
      {
        "bg": "rgb(59, 130, 246)",
        "color": "rgb(255, 255, 255)",
        "borderRadius": "8px",
        "padding": "12px 24px"
      }
    ],
    "inputs": {
      "textInputs": [
        {
          "type": "text",
          "base": {
            "bg": "rgb(255, 255, 255)",
            "border": "1px solid rgb(203, 213, 225)",
            "radius": "6px"
          },
          "focus": {
            "borderColor": "rgb(59, 130, 246)",
            "shadow": "0 0 0 3px rgba(59, 130, 246, 0.5)"
          }
        }
      ],
      "checkboxes": [],
      "toggles": []
    }
  },
  "scannedPages": 5,
  "scannedUrls": [
    "https://example.com",
    "https://example.com/about"
  ]
}`}
                                </pre>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ApiDocs;
