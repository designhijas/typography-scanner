import React from 'react';

const TypeCard = ({ styleData }) => {
    const { fontFamily, fontSize, fontWeight, lineHeight, color, tagName } = styleData;

    // Clean up font family string (remove quotes if present)
    const cleanFontFamily = fontFamily.replace(/['"]/g, '');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
            {/* Visual Preview */}
            <div className="border-b border-slate-100 pb-4 min-h-[80px] flex items-center overflow-hidden">
                <p
                    style={{
                        fontFamily: cleanFontFamily,
                        fontSize: fontSize,
                        fontWeight: fontWeight,
                        lineHeight: lineHeight,
                        color: color,
                    }}
                    className="truncate"
                >
                    The quick brown fox jumps over the lazy dog.
                </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 font-mono">
                <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                    <span className="font-bold text-slate-700">Tag:</span> {tagName}
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                    <span className="font-bold text-slate-700">Size:</span> {fontSize}
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                    <span className="font-bold text-slate-700">Weight:</span> {fontWeight}
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1" title={cleanFontFamily}>
                    <span className="font-bold text-slate-700">Family:</span> <span className="truncate max-w-[150px]">{cleanFontFamily}</span>
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                    <span className="font-bold text-slate-700">Color:</span>
                    <span className="w-3 h-3 rounded-full border border-slate-300 inline-block" style={{ backgroundColor: color }}></span>
                    {color}
                </div>
            </div>
        </div>
    );
};

export default TypeCard;
