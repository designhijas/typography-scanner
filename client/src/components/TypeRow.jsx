import React from 'react';

const TypeRow = ({ styleData }) => {
    const { name, fontFamily, fontSize, fontSizePx, fontWeight, lineHeight, lineHeightPx, color } = styleData;

    // Clean up font family string
    const cleanFontFamily = fontFamily.replace(/['"]/g, '');

    // Calculate REM (assuming 16px base)
    const remSize = (fontSizePx / 16).toFixed(3);

    // Calculate Line Height % or unitless
    let lhDisplay = lineHeight;
    if (lineHeightPx && fontSizePx) {
        const ratio = (lineHeightPx / fontSizePx) * 100;
        lhDisplay = `${Math.round(ratio)}%`;
    }
    if (lineHeight === 'normal') lhDisplay = '120%'; // Approx

    return (
        <div className="group flex flex-col md:flex-row items-baseline gap-8 py-8 border-b border-slate-100 hover:bg-slate-50 transition-colors px-2">
            {/* Left Column: Specs */}
            <div className="w-full md:w-48 flex-shrink-0 flex md:block justify-between items-start">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{name}</h3>

                <div className="text-xs text-slate-400 font-mono space-y-1.5 text-right md:text-left">
                    <div className="flex flex-col">
                        <span className="text-slate-600">{remSize}rem / {Math.round(fontSizePx)}px</span>
                        <span>{lhDisplay} / {Math.round(lineHeightPx)}px</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Preview */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <p
                    style={{
                        fontFamily: cleanFontFamily,
                        fontSize: fontSize,
                        fontWeight: fontWeight,
                        lineHeight: lineHeight,
                        // color: color, // Forced to black for visibility
                    }}
                    className="break-words whitespace-normal text-slate-900"
                >
                    The quick brown fox jumps
                </p>
                <div className="mt-3 flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">{cleanFontFamily}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                    <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">{fontWeight}</p>
                </div>
            </div>
        </div>
    );
};

export default TypeRow;
