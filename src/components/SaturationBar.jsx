import { SlidersHorizontal, Check } from 'lucide-react';

export default function SaturationBar({
  saturation,
  setSaturation,
  onDone,
}) {
  return (
    <div className="fixed top-20 left-20 right-4 sm:left-auto sm:right-6 z-20 flex flex-wrap items-center gap-2 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-lg shadow-neutral-900/5 text-xs text-neutral-800 animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-1.5 px-1.5 font-medium text-neutral-800">
        <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-700" />
        <span className="font-semibold text-xs">Image Saturation</span>
      </div>

      <div className="w-[1px] h-4 bg-neutral-200 mx-0.5" />

      <div className="flex items-center gap-2 bg-neutral-100/90 px-2.5 py-1 rounded-xl border border-neutral-200/50">
        <input
          type="range"
          min="0"
          max="200"
          step="1"
          value={saturation}
          onChange={(e) => setSaturation(Math.max(0, Number(e.target.value)))}
          className="w-28 sm:w-36 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
        />
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') return;
              setSaturation(Math.max(0, Math.min(200, Number(val))));
            }}
            className="w-12 px-1.5 py-0.5 font-mono text-[11px] text-center bg-white text-neutral-900 rounded-md border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-2xs"
          />
          <span className="font-mono text-[11px] text-neutral-500 font-medium">%</span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl">
        {[
          { label: 'B&W', value: 0 },
          { label: 'Normal', value: 100 },
          { label: 'Vibrant', value: 140 },
          { label: 'Max', value: 200 },
        ].map((p) => {
          const isSelected = saturation === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setSaturation(p.value)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-medium cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-4 bg-neutral-200 mx-0.5" />

      <button
        type="button"
        onClick={onDone}
        className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl text-[11px] font-semibold cursor-pointer transition-all shadow-xs"
      >
        <Check className="w-3 h-3" />
        <span>Done</span>
      </button>
    </div>
  );
}
