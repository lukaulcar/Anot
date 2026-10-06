import {
  MousePointer,
  Square,
  ArrowUpRight,
  Circle,
  Slash,
  Pencil,
  Type,
  EyeOff,
  Crop,
  SlidersHorizontal,
} from 'lucide-react';
import { TOOL_TYPES } from '../utils/canvas';

export default function Toolbar({ currentTool, setTool, saturation = 100 }) {
  const tools = [
    { id: TOOL_TYPES.SELECT, label: 'Select', icon: MousePointer, key: 'V' },
    { id: TOOL_TYPES.CROP, label: 'Crop', icon: Crop, key: 'X' },
    { id: TOOL_TYPES.SATURATION, label: 'Saturation', icon: SlidersHorizontal, key: 'S' },
    { id: TOOL_TYPES.RECTANGLE, label: 'Rectangle', icon: Square, key: 'R' },
    { id: TOOL_TYPES.ARROW, label: 'Arrow', icon: ArrowUpRight, key: 'A' },
    { id: TOOL_TYPES.CIRCLE, label: 'Circle', icon: Circle, key: 'C' },
    { id: TOOL_TYPES.LINE, label: 'Line', icon: Slash, key: 'L' },
    { id: TOOL_TYPES.PEN, label: 'Pen', icon: Pencil, key: 'P' },
    { id: TOOL_TYPES.TEXT, label: 'Text', icon: Type, key: 'T' },
    { id: TOOL_TYPES.REDACT, label: 'Redact', icon: EyeOff, key: 'B' },
  ];

  return (
    <aside className="fixed z-20 flex gap-1 md:gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-lg shadow-neutral-900/5 transition-all flex-row items-center left-1/2 -translate-x-1/2 bottom-3 top-auto max-w-[calc(100vw-1rem)] overflow-x-auto md:overflow-visible md:max-w-none md:flex-col md:items-stretch md:left-4 md:top-20 md:bottom-auto md:translate-x-0">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = currentTool === t.id;
        const isModifiedSaturation = t.id === TOOL_TYPES.SATURATION && saturation !== 100;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.key})`}
            className={`group relative p-2 md:p-2.5 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all ${
              isActive
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200'
            }`}
          >
            <Icon className="w-4 h-4 transition-transform group-hover:scale-105" />

            {isModifiedSaturation && !isActive && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}

            <div className="absolute left-full ml-3 px-2.5 py-1 bg-neutral-900 text-white text-[11px] font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-md hidden md:flex items-center gap-1.5">
              <span>{t.label}</span>
              <kbd className="px-1 py-0.2 bg-neutral-800 rounded font-mono text-[9px] text-neutral-300">
                {t.key}
              </kbd>
            </div>
          </button>
        );
      })}
    </aside>
  );
}
