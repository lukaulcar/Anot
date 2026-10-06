import { Check, X, RotateCcw, ArrowDown } from 'lucide-react';

export default function CropBar({
  imageMeta,
  cropBox,
  onApplyCrop,
  onCancelCrop,
  onTrimTopPercent,
  onResetCrop,
}) {
  if (!cropBox || !imageMeta) return null;

  const croppedW = Math.round(cropBox.width);
  const croppedH = Math.round(cropBox.height);
  const topCut = Math.round(cropBox.y);

  return (
    <div className="fixed top-[60px] sm:top-20 left-2 right-2 md:left-20 md:right-4 lg:left-auto lg:right-6 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-lg shadow-neutral-900/5 text-xs text-neutral-800 animate-in fade-in zoom-in-95 max-h-[32vh] md:max-h-none overflow-y-auto md:overflow-visible">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 font-mono text-[11px] font-semibold text-neutral-700">
        <span>{croppedW} × {croppedH}px</span>
        {topCut > 0 && (
          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            -{topCut}px top
          </span>
        )}
      </div>

      <div className="w-[1px] h-4 bg-neutral-200 mx-0.5" />

      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider hidden md:inline mr-1">
          Quick:
        </span>
        <button
          type="button"
          onClick={() => onTrimTopPercent(0.08)}
          title="Trim top 8%"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-900 hover:text-white cursor-pointer text-neutral-700 border border-neutral-200 hover:border-neutral-900 transition-colors font-medium text-[11px]"
        >
          <ArrowDown className="w-3 h-3 text-neutral-500" />
          <span>Cut Top 8%</span>
        </button>
        <button
          type="button"
          onClick={() => onTrimTopPercent(0.15)}
          title="Trim top 15%"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-900 hover:text-white cursor-pointer text-neutral-700 border border-neutral-200 hover:border-neutral-900 transition-colors font-medium text-[11px]"
        >
          <ArrowDown className="w-3 h-3 text-neutral-500" />
          <span>Cut Top 15%</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onResetCrop}
        title="Reset crop to full image"
        className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 cursor-pointer transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-neutral-200 mx-0.5" />

      <button
        type="button"
        onClick={onCancelCrop}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 cursor-pointer border border-transparent hover:border-neutral-300 transition-colors font-medium"
      >
        <X className="w-3.5 h-3.5" />
        <span>Cancel</span>
      </button>

      <button
        type="button"
        onClick={onApplyCrop}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer transition-all font-semibold shadow-xs"
      >
        <Check className="w-3.5 h-3.5" />
        <span>Apply Crop</span>
      </button>
    </div>
  );
}
