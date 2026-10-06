import {
  COLOR_PALETTE,
  TOOL_TYPES,
} from '../utils/canvas';
import { Trash2, Copy, Check } from 'lucide-react';

// Good enough for picking a readable check icon.
function isLightColor(hex) {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b > 186;
}

export default function StyleBar({
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  filled,
  setFilled,
  fontSize,
  setFontSize,
  currentTool,
  selectedAnnotation,
  onDeleteSelected,
  onDuplicateSelected,
}) {
  const supportsFill =
    currentTool === TOOL_TYPES.RECTANGLE ||
    currentTool === TOOL_TYPES.CIRCLE ||
    (selectedAnnotation &&
      (selectedAnnotation.type === TOOL_TYPES.RECTANGLE ||
        selectedAnnotation.type === TOOL_TYPES.CIRCLE));

  const isTextTool =
    currentTool === TOOL_TYPES.TEXT ||
    (selectedAnnotation && selectedAnnotation.type === TOOL_TYPES.TEXT);

  const isCustomColor = !COLOR_PALETTE.some(
    (c) => c.value.toLowerCase() === color.toLowerCase()
  );

  return (
    <div className="fixed top-[60px] sm:top-20 left-2 right-2 md:left-20 md:right-4 lg:left-auto lg:right-6 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-lg shadow-neutral-900/5 text-xs text-neutral-800 max-h-[32vh] md:max-h-none overflow-y-auto md:overflow-visible">
      {selectedAnnotation && (
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200">
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
            {selectedAnnotation.type}
          </span>
          <button
            type="button"
            onClick={onDuplicateSelected}
            title="Duplicate selected (Ctrl+D)"
            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            title="Delete selected (Del)"
            className="p-1.5 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {COLOR_PALETTE.map((c) => {
          const isSelected = color.toLowerCase() === c.value.toLowerCase();
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.label}
              style={{ backgroundColor: c.value }}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border cursor-pointer transition-all flex items-center justify-center relative shrink-0 ${
                c.value === '#ffffff' ? 'border-neutral-300' : 'border-transparent'
              } ${isSelected ? 'scale-115 ring-2 ring-neutral-900 ring-offset-2' : 'hover:scale-105 hover:ring-2 hover:ring-neutral-300 hover:ring-offset-1'}`}
            >
              {isSelected && (
                <Check
                  className={`w-3 h-3 ${
                    c.value === '#ffffff' ? 'text-black' : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}

        <div className="relative group">
          <button
            type="button"
            title="Pick custom color"
            style={{
              backgroundColor: isCustomColor ? color : undefined,
            }}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border cursor-pointer transition-all flex items-center justify-center relative overflow-hidden shrink-0 ${
              isCustomColor
                ? 'scale-115 ring-2 ring-neutral-900 ring-offset-2 border-transparent'
                : 'hover:scale-105 hover:ring-2 hover:ring-neutral-300 hover:ring-offset-1 border-neutral-300 bg-linear-to-tr from-rose-500 via-indigo-500 to-amber-400'
            }`}
          >
            {isCustomColor ? (
              <Check
                className={`w-3 h-3 ${
                  isLightColor(color) ? 'text-black' : 'text-white'
                }`}
              />
            ) : (
              <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
            )}
          </button>
          <input
            type="color"
            value={color.startsWith('#') && color.length === 7 ? color : '#ffffff'}
            onChange={(e) => setColor(e.target.value)}
            title="Choose custom color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
      </div>

      <div className="w-[1px] h-4 bg-neutral-200 mx-0.5" />

      {isTextTool ? (
        <div className="flex items-center gap-1.5 bg-neutral-100/90 px-2 py-1 rounded-xl border border-neutral-200/50">
          <span className="text-[11px] font-medium text-neutral-500 select-none">Size</span>
          <input
            type="range"
            min="8"
            max="96"
            value={fontSize}
            onChange={(e) => setFontSize(Math.max(8, Number(e.target.value)))}
            className="w-12 min-[400px]:w-16 sm:w-20 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
          />
          <input
            type="number"
            min="8"
            max="150"
            value={fontSize}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') return;
              setFontSize(Math.max(8, Math.min(150, Number(val))));
            }}
            className="w-10 px-1 py-0.5 font-mono text-[11px] text-center bg-white text-neutral-900 rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
          />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-neutral-100/90 px-2 py-1 rounded-xl border border-neutral-200/50">
          <span className="text-[11px] font-medium text-neutral-500 select-none">Width</span>
          <input
            type="range"
            min="1"
            max="40"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Math.max(1, Number(e.target.value)))}
            className="w-12 min-[400px]:w-16 sm:w-20 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
          />
          <div className="flex items-center gap-0.5">
            <input
              type="number"
              min="1"
              max="100"
              value={strokeWidth}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') return;
                setStrokeWidth(Math.max(1, Math.min(100, Number(val))));
              }}
              className="w-9 px-1 py-0.5 font-mono text-[11px] text-center bg-white text-neutral-900 rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
            />
            <span className="font-mono text-[11px] text-neutral-500 font-medium">px</span>
          </div>
        </div>
      )}

      {supportsFill && (
        <>
          <div className="w-[1px] h-4 bg-neutral-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setFilled(!filled)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium cursor-pointer transition-all border ${
              filled
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs hover:bg-neutral-700'
                : 'bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {filled ? 'Filled' : 'Outline'}
          </button>
        </>
      )}


    </div>
  );
}
