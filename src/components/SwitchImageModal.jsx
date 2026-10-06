import { createPortal } from 'react-dom';
import { ImagePlus, X } from 'lucide-react';

export default function SwitchImageModal({ pendingImage, hasAnnotations, onConfirm, onCancel }) {
  if (!pendingImage) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="fixed inset-0" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-sm w-full p-6 text-neutral-900 animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <ImagePlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold tracking-tight">Edit new picture?</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            title="Cancel"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 mb-4 overflow-hidden">
          {pendingImage.src && (
            <img
              src={pendingImage.src}
              alt={pendingImage.name || 'New image'}
              className="w-14 h-14 rounded-lg object-cover border border-neutral-200 shrink-0 bg-white"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" title={pendingImage.name}>
              {pendingImage.name || 'New image'}
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              {pendingImage.width} × {pendingImage.height}px
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-500 leading-relaxed mb-5">
          {hasAnnotations
            ? 'Dropping this image will discard your current edits and annotations. Do you want to continue?'
            : 'Do you want to switch to editing this picture?'}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="flex-1 py-2 px-4 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-700 rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            Yes, edit it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
