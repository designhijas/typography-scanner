import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TypeRow from './components/TypeRow';
import ApiDocs from './ApiDocs';

function Scanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('typography');
  const [scanMultiplePages, setScanMultiplePages] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    setLoadingProgress(0);

    // Adjust durations based on scan type
    const multiplier = scanMultiplePages ? 3 : 1;
    const stages = [
      { message: 'Fetching pages...', duration: 2000 * multiplier },
      { message: 'Analyzing design system...', duration: 3000 * multiplier },
      { message: 'Extracting colors & typography...', duration: 2500 * multiplier },
      { message: 'Processing components...', duration: 2000 * multiplier },
      { message: 'Finalizing data...', duration: 1500 * multiplier }
    ];

    setLoadingMessage(stages[0].message);

    // Smooth progress animation
    let currentStage = 0;
    let currentProgress = 0;
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    const intervalTime = 100;
    const totalTicks = totalDuration / intervalTime;

    const progressInterval = setInterval(() => {
      currentProgress += 1;
      const maxProgress = 95; // Cap at 95% until actual completion

      // Calculate percentage: (current tick / total ticks) * 100
      const calculatedProgress = (currentProgress / totalTicks) * 100;
      const newProgress = Math.min(calculatedProgress, maxProgress);

      setLoadingProgress(newProgress);

      // Update message based on time elapsed
      const timeElapsed = currentProgress * intervalTime;
      let accumulatedDuration = 0;

      for (let i = 0; i < stages.length; i++) {
        accumulatedDuration += stages[i].duration;
        if (timeElapsed < accumulatedDuration) {
          if (currentStage !== i) {
            currentStage = i;
            setLoadingMessage(stages[i].message);
          }
          break;
        }
      }
    }, intervalTime);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          scanMultiplePages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const result = await response.json();

      // Complete the progress bar
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage('Complete!');

      // Small delay to show 100% before displaying results
      setTimeout(() => {
        setData(result);
        setLoading(false);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'Something went wrong');
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const exportToJSON = (viewport) => {
    if (!data || !data.typography) return;

    const styles = viewport === 'desktop' ? data.typography.desktop : data.typography.mobile;
    const allStyles = [...data.typography.desktop, ...data.typography.mobile];

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

  // Helper to get contrast color for text
  const getContrastColor = (hexcolor) => {
    if (!hexcolor) return '#000000';
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  // Helper to organize colors into a palette structure
  const organizePalette = (colors) => {
    if (!colors || colors.length === 0) return [];

    // Sort colors by hue/brightness for better visual organization
    const sorted = [...colors].sort();

    // Group into rows of 10
    const rows = [];
    for (let i = 0; i < sorted.length; i += 10) {
      rows.push(sorted.slice(i, i + 10));
    }

    return rows;
  };

  const renderContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'typography':
        return (
          <>
            {/* Export Buttons */}
            <div className="mb-8 flex justify-end gap-3">
              <button
                onClick={() => exportToJSON('desktop')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all active:scale-95 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Desktop
              </button>
              <button
                onClick={() => exportToJSON('mobile')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all active:scale-95 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Mobile
              </button>
            </div>

            {/* Font Families Section */}
            {data.typography.fontFamilies && data.typography.fontFamilies.length > 0 && (
              <div className="mb-12 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Font Families Used</h2>
                <div className="flex flex-wrap gap-3">
                  {data.typography.fontFamilies.map((family, index) => (
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
                  {data.typography.desktop.map((style, index) => (
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
                  {data.typography.mobile.map((style, index) => (
                    <TypeRow key={`mobile-${index}`} styleData={style} />
                  ))}
                </div>
              </section>
            </div>
          </>
        );

      case 'colors':
        const paletteRows = organizePalette(data.colors.palette);

        return (
          <div className="space-y-16">
            {/* Primary Palette */}
            <section>
              <h3 className="text-2xl font-bold mb-8 text-slate-900">Primary Palette</h3>
              <div className="space-y-6">
                {paletteRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {row.map((color, colIndex) => {
                      const label = `primary-${(rowIndex * 10 + colIndex + 1) * 50}`;
                      return (
                        <div key={colIndex} className="flex-1 min-w-0">
                          <div
                            className="h-24 rounded-lg shadow-sm border border-slate-200 mb-2 transition-transform hover:scale-105 cursor-pointer relative group"
                            style={{ backgroundColor: color }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-mono px-2 py-1 rounded bg-black/50 text-white backdrop-blur-sm">
                                {color}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] font-medium text-slate-500 text-center mb-1">{label}</p>
                          <p className="text-[9px] font-mono text-slate-400 text-center select-all">{color}</p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            {/* Dominant Colors */}
            <section>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Dominant Colors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {data.colors.dominant.map((c, i) => (
                  <div key={i} className="group">
                    <div className="h-32 rounded-lg shadow-md border border-slate-200 mb-3 transition-transform group-hover:scale-105" style={{ backgroundColor: c }}></div>
                    <p className="text-xs font-mono text-slate-500 uppercase select-all text-center">{c}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Text Colors */}
            {data.colors.text && data.colors.text.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Text Colors ({data.colors.text.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {data.colors.text.map((c, i) => (
                    <div key={i} className="flex flex-col items-center group">
                      <div className="w-full aspect-square rounded-lg shadow-sm border border-slate-200 mb-2 flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: c }}>
                        <span className="text-2xl font-bold" style={{ color: getContrastColor(c) }}>Aa</span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 truncate w-full text-center select-all">{c}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Border Colors */}
            {data.colors.borders && data.colors.borders.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Border Colors ({data.colors.borders.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {data.colors.borders.map((c, i) => (
                    <div key={i} className="flex flex-col items-center group">
                      <div className="w-full aspect-square rounded-lg shadow-sm bg-white mb-2 flex items-center justify-center transition-transform group-hover:scale-110" style={{ border: `3px solid ${c}` }}>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 truncate w-full text-center select-all">{c}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Background Colors */}
            {data.colors.backgrounds && data.colors.backgrounds.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Background Colors ({data.colors.backgrounds.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {data.colors.backgrounds.map((c, i) => (
                    <div key={i} className="flex flex-col items-center group">
                      <div className="w-full aspect-square rounded-lg shadow-sm border border-slate-200 mb-2 transition-transform group-hover:scale-110" style={{ backgroundColor: c }}></div>
                      <p className="text-[9px] font-mono text-slate-400 truncate w-full text-center select-all">{c}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gradients */}
            {data.colors.gradients && data.colors.gradients.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Gradients ({data.colors.gradients.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.colors.gradients.map((g, i) => (
                    <div key={i} className="p-4 border border-slate-200 rounded-lg">
                      <div className="h-32 rounded-md mb-3 shadow-sm" style={{ backgroundImage: g }}></div>
                      <p className="text-[10px] font-mono text-slate-400 break-all">{g}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case 'spacing':
        return (
          <div className="space-y-16">
            {/* Container Widths */}
            <section>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Container Widths</h3>
              <div className="space-y-6">
                {['Mobile', 'Tablet', 'Laptop', 'Desktop'].map(category => {
                  const widths = data.spacing.containerWidths.filter(w => w.category === category);
                  if (widths.length === 0) return null;

                  return (
                    <div key={category} className="border border-slate-200 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        {category}
                      </h4>
                      <div className="space-y-3">
                        {widths.map((w, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-mono text-slate-600 font-medium">{w.value}</div>
                            <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-end pr-3"
                                style={{ width: `${Math.min((w.px / 1920) * 100, 100)}%` }}
                              >
                                <span className="text-xs font-mono text-white font-medium">{Math.round(w.px)}px</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Gap Values */}
            <section>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Gap Values</h3>
              <div className="flex flex-wrap gap-4">
                {data.spacing.gaps.map((g, i) => (
                  <div key={i} className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    {g}
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case 'borders':
        return (
          <div className="space-y-16">
            <section>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Border Radius</h3>
              <div className="flex flex-wrap gap-8">
                {data.borders.radius.map((r, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 border-4 border-slate-900 bg-slate-100 shadow-lg transition-transform hover:scale-110" style={{ borderRadius: r }}></div>
                    <p className="text-xs font-mono text-slate-500 font-medium">{r}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Box Shadows</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.borders.boxShadows.map((s, i) => (
                  <div key={i} className="p-8 bg-white rounded-lg border border-slate-100 transition-transform hover:scale-105" style={{ boxShadow: s }}>
                    <p className="text-xs font-mono text-slate-400 break-all">{s}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case 'components':
        return (
          <div className="space-y-16">
            {/* Buttons */}
            <section>
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Buttons</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.components.buttons.map((btn, i) => (
                  <div key={i} className="p-6 border border-slate-200 rounded-lg flex flex-col items-start gap-4 bg-slate-50">
                    <button
                      style={{
                        backgroundColor: btn.bg,
                        color: btn.color,
                        borderRadius: btn.radius,
                        padding: btn.padding,
                        border: btn.border,
                        fontSize: btn.fontSize,
                        fontWeight: btn.fontWeight,
                        fontFamily: btn.fontFamily,
                        textTransform: btn.textTransform,
                        letterSpacing: btn.letterSpacing,
                        boxShadow: btn.boxShadow,
                        display: btn.display || 'inline-block',
                        alignItems: btn.alignItems,
                        justifyContent: btn.justifyContent,
                        cursor: 'pointer'
                      }}
                      className="transition-transform hover:scale-105"
                    >
                      {btn.text || 'Button'}
                    </button>
                    <div className="text-[9px] font-mono text-slate-400 space-y-1 w-full">
                      <p className="truncate">Text: {btn.text}</p>
                      <p>BG: {btn.bg}</p>
                      <p>Color: {btn.color}</p>
                      <p>Radius: {btn.radius}</p>
                      {btn.fontSize && <p>Font: {btn.fontSize}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Text Inputs */}
            {data.components.inputs.textInputs && data.components.inputs.textInputs.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Text Input Fields</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {data.components.inputs.textInputs.map((inp, i) => (
                    <InputField key={i} inp={inp} />
                  ))}
                </div>
              </section>
            )}

            {/* Textareas */}
            {data.components.inputs.textareas && data.components.inputs.textareas.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Textarea Fields</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.components.inputs.textareas.map((textarea, i) => (
                    <div key={i} className="p-6 border border-slate-200 rounded-lg bg-white">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Textarea</p>
                      <textarea
                        placeholder={textarea.placeholder || 'Enter text...'}
                        readOnly
                        rows={textarea.rows}
                        style={{
                          backgroundColor: textarea.base.bg,
                          border: textarea.base.border,
                          borderRadius: textarea.base.radius,
                          padding: textarea.base.padding,
                          color: textarea.base.color,
                          boxShadow: textarea.base.shadow,
                          fontSize: textarea.base.fontSize,
                          fontWeight: textarea.base.fontWeight,
                          fontFamily: textarea.base.fontFamily,
                          resize: textarea.base.resize,
                          width: '100%'
                        }}
                      />
                      <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
                        <p>Rows: {textarea.rows}</p>
                        <p>Resize: {textarea.base.resize}</p>
                        <p>BG: {textarea.base.bg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Select Dropdowns */}
            {data.components.inputs.selects && data.components.inputs.selects.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Select Dropdowns</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.components.inputs.selects.map((select, i) => (
                    <div key={i} className="p-6 border border-slate-200 rounded-lg bg-white">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select / Dropdown</p>
                      <select
                        style={{
                          backgroundColor: select.base.bg,
                          border: select.base.border,
                          borderRadius: select.base.radius,
                          padding: select.base.padding,
                          color: select.base.color,
                          boxShadow: select.base.shadow,
                          fontSize: select.base.fontSize,
                          fontWeight: select.base.fontWeight,
                          fontFamily: select.base.fontFamily,
                          width: '100%'
                        }}
                      >
                        {select.options.map((opt, j) => (
                          <option key={j}>{opt}</option>
                        ))}
                      </select>
                      <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
                        <p>Options: {select.options.length}</p>
                        <p>BG: {select.base.bg}</p>
                        <p>Border: {select.base.borderColor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Checkboxes */}
            {data.components.inputs.checkboxes && data.components.inputs.checkboxes.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Checkboxes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.components.inputs.checkboxes.map((checkbox, i) => (
                    <div key={i} className="p-6 border border-slate-200 rounded-lg bg-white">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Checkbox</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={checkbox.checked}
                          style={{
                            backgroundColor: checkbox.base.bg,
                            border: checkbox.base.border,
                            borderRadius: checkbox.base.radius,
                            width: checkbox.base.width,
                            height: checkbox.base.height,
                            accentColor: checkbox.base.accentColor
                          }}
                        />
                        <span className="text-sm">{checkbox.label || 'Checkbox label'}</span>
                      </label>
                      <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
                        <p>Size: {checkbox.base.width}</p>
                        <p>Border: {checkbox.base.borderColor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Radio Buttons */}
            {data.components.inputs.radios && data.components.inputs.radios.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Radio Buttons</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.components.inputs.radios.map((radio, i) => (
                    <div key={i} className="p-6 border border-slate-200 rounded-lg bg-white">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Radio Button</p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`radio-group-${i}`}
                          defaultChecked={radio.checked}
                          style={{
                            backgroundColor: radio.base.bg,
                            border: radio.base.border,
                            width: radio.base.width,
                            height: radio.base.height,
                            accentColor: radio.base.accentColor
                          }}
                        />
                        <span className="text-sm">{radio.label || 'Radio option'}</span>
                      </label>
                      <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
                        <p>Size: {radio.base.width}</p>
                        <p>Border: {radio.base.borderColor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Toggle Switches */}
            {data.components.inputs.toggles && data.components.inputs.toggles.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Toggle Switches</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.components.inputs.toggles.map((toggle, i) => (
                    <div key={i} className="p-6 border border-slate-200 rounded-lg bg-white">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Toggle Switch</p>
                      <div
                        className="relative inline-block"
                        style={{
                          width: toggle.base.width,
                          height: toggle.base.height
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: toggle.checked ? '#3B82F6' : toggle.base.bg,
                            border: toggle.base.border,
                            borderRadius: toggle.base.radius,
                            width: '100%',
                            height: '100%'
                          }}
                          className="transition-colors"
                        />
                      </div>
                      <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
                        <p>Checked: {toggle.checked ? 'Yes' : 'No'}</p>
                        <p>BG: {toggle.base.bg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case 'brand':
        return (
          <div className="space-y-16">
            {/* Logo */}
            {data.brand.logo && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Logo</h3>
                <div className="p-12 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                  <img
                    src={data.brand.logo.src}
                    alt="Brand Logo"
                    className="max-h-32 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-slate-400 text-sm">Logo not available</div>
                  {!data.brand.logo.isFavicon && data.brand.logo.width && (
                    <p className="mt-4 text-xs font-mono text-slate-400 text-center">
                      {Math.round(data.brand.logo.width)} × {Math.round(data.brand.logo.height)}px
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Meta Images */}
            {(data.brand.meta?.ogImage || data.brand.meta?.twitterImage || data.brand.meta?.favicon) && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Meta Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data.brand.meta.ogImage && (
                    <div className="border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">OG Image</p>
                      <img src={data.brand.meta.ogImage} alt="OG" className="w-full rounded" />
                    </div>
                  )}
                  {data.brand.meta.twitterImage && (
                    <div className="border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Twitter Image</p>
                      <img src={data.brand.meta.twitterImage} alt="Twitter" className="w-full rounded" />
                    </div>
                  )}
                  {data.brand.meta.favicon && (
                    <div className="border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Favicon</p>
                      <img src={data.brand.meta.favicon} alt="Favicon" className="w-16 h-16 object-contain" />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Social Links */}
            {data.brand.socialLinks && data.brand.socialLinks.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Social Links</h3>
                <ul className="space-y-3">
                  {data.brand.socialLinks.map((link, i) => {
                    const platform = link.includes('facebook') ? 'Facebook' :
                      link.includes('twitter') || link.includes('x.com') ? 'Twitter/X' :
                        link.includes('instagram') ? 'Instagram' :
                          link.includes('linkedin') ? 'LinkedIn' :
                            link.includes('youtube') ? 'YouTube' :
                              link.includes('github') ? 'GitHub' :
                                link.includes('tiktok') ? 'TikTok' : 'Social';

                    return (
                      <li key={i} className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{platform}</p>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                            {link}
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Empty State */}
            {!data.brand.logo && (!data.brand.socialLinks || data.brand.socialLinks.length === 0) && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-slate-400">No brand information found on this website</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-black selection:text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-20 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Design System Scanner
            </h1>
            <Link to="/api-docs" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Use API →
            </Link>
          </div>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            Enter a website URL to extract its design system tokens.
            We'll analyze typography, colors, spacing, and components.
          </p>

          {/* Multi-page Scan Toggle */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Scan Multiple Pages</p>
                <p className="text-xs text-slate-500 mt-1">
                  Scan homepage + up to 19 main navigation pages for comprehensive data
                </p>
              </div>
              <div className="relative ml-4">
                <input
                  type="checkbox"
                  checked={scanMultiplePages}
                  onChange={(e) => setScanMultiplePages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-slate-900"></div>
              </div>
            </label>
          </div>

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
              className="inline-flex justify-center items-center px-8 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 rounded-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {loadingMessage}
                </>
              ) : (
                'Scan Website'
              )}
            </button>
          </form>

          {/* Loading Progress Indicator */}
          {loading && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{loadingMessage}</span>
                    <span className="text-xs text-slate-600">{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-slate-900 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {scanMultiplePages ? 'Scanning multiple pages...' : 'Scanning single page...'}
                  </p>
                </div>
              </div>
            </div>
          )}
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
          <div>
            {/* Section Header (Title + Description) */}
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-slate-900 capitalize mb-3">{activeTab}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                {activeTab === 'typography' && 'Analyze font families, sizes, and weights used across the site.'}
                {activeTab === 'colors' && 'Explore the color palette, backgrounds, and text colors.'}
                {activeTab === 'spacing' && 'Review spacing scales and container widths.'}
                {activeTab === 'borders' && 'Inspect border radii, widths, and box shadows.'}
                {activeTab === 'components' && 'Examine buttons, inputs, and other UI elements.'}
                {activeTab === 'brand' && 'View extracted logos, social links, and metadata.'}
              </p>

              {/* Scanned Pages Count (Small) */}
              {data.scannedPages > 1 && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => document.getElementById('scanned-pages-details').toggleAttribute('open')}>
                  <span>Analyzed {data.scannedPages} pages</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              )}
            </div>

            {/* Scanned Pages Details (Hidden by default) */}
            {data.scannedUrls && data.scannedUrls.length > 0 && (
              <details id="scanned-pages-details" className="mb-8 max-w-2xl mx-auto">
                <summary className="sr-only">View pages</summary>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Scanned URLs</h4>
                  <div className="space-y-2">
                    {data.scannedUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200">
                        <span className="text-xs font-mono text-slate-400 w-5">{index + 1}.</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex-1">{url}</a>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}

            {/* Tabs (Centered) */}
            <div className="flex justify-center border-b border-slate-200 mb-16 overflow-x-auto no-scrollbar">
              {['Typography', 'Colors', 'Spacing', 'Borders', 'Components', 'Brand'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-8 py-4 text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === tab.toLowerCase()
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-500">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Scanner />} />
        <Route path="/api-docs" element={<ApiDocs />} />
      </Routes>
    </Router>
  );
}

export default App;

const InputField = ({ inp }) => {
  const [showFocus, setShowFocus] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base State</p>
        <button
          onClick={() => setShowFocus(!showFocus)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          {showFocus ? 'Hide States' : 'Show Focus & Error'}
          <svg className={`w-3 h-3 transition-transform ${showFocus ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Base State (Always Visible) */}
      <div className="p-6 border border-slate-200 rounded-lg bg-white">
        <input
          type={inp.type}
          placeholder={inp.placeholder || `${inp.type} field`}
          readOnly
          style={{
            backgroundColor: inp.base.bg,
            border: inp.base.border,
            borderRadius: inp.base.radius,
            padding: inp.base.padding,
            color: inp.base.color,
            boxShadow: inp.base.shadow,
            fontSize: inp.base.fontSize,
            fontWeight: inp.base.fontWeight,
            fontFamily: inp.base.fontFamily,
            width: '100%'
          }}
        />
        <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
          <p>Type: {inp.type}</p>
          <p>Border: {inp.base.borderColor}</p>
          <p>BG: {inp.base.bg}</p>
        </div>
      </div>

      {/* Focus & Error States (Conditional) */}
      {showFocus && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Focus State */}
          {inp.focus && (
            <div className="p-6 border-2 border-blue-300 rounded-lg bg-blue-50">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Focus State</p>
              <input
                type={inp.type}
                placeholder={inp.placeholder || `${inp.type} field (focused)`}
                readOnly
                style={{
                  backgroundColor: inp.focus.bg || inp.base.bg,
                  border: `2px solid ${inp.focus.borderColor}`,
                  borderRadius: inp.base.radius,
                  padding: inp.base.padding,
                  color: inp.base.color,
                  boxShadow: inp.focus.shadow,
                  fontSize: inp.base.fontSize,
                  fontWeight: inp.base.fontWeight,
                  fontFamily: inp.base.fontFamily,
                  outline: inp.focus.outline,
                  width: '100%'
                }}
              />
              <div className="mt-3 text-[9px] font-mono text-slate-400 space-y-1">
                <p>Border: {inp.focus.borderColor}</p>
                <p>Shadow: {inp.focus.shadow !== 'none' ? 'Yes' : 'None'}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          <div className="p-6 border-2 border-red-300 rounded-lg bg-red-50">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Error State</p>
            <input
              type={inp.type}
              placeholder={inp.placeholder || `${inp.type} field (error)`}
              readOnly
              style={{
                backgroundColor: inp.base.bg,
                border: '2px solid #EF4444',
                borderRadius: inp.base.radius,
                padding: inp.base.padding,
                color: '#DC2626',
                fontSize: inp.base.fontSize,
                fontWeight: inp.base.fontWeight,
                fontFamily: inp.base.fontFamily,
                width: '100%'
              }}
            />
            <p className="mt-2 text-xs text-red-600">This field is required</p>
          </div>
        </div>
      )}
    </div>
  );
};
