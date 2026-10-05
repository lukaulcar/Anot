import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Copy,
  Check,
  Undo2,
  Redo2,
  Trash2,
  ImageUp,
  ChevronDown,
  HelpCircle,
  FileImage,
  X
} from 'lucide-react';

export default function Navbar({
  imageMeta,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onChangeImage,
  onExport,
  onCopyClipboard,
  hasAnnotations,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handlePointerDown = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportMenu]);

  useEffect(() => {
    if (!showShortcuts) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  const handleCopy = async () => {
    try {
      const success = await onCopyClipboard?.();
      setShowExportMenu(false);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      setShowExportMenu(false);
    }
  };

  return (
    <header className="h-16 border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {imageMeta && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <FileImage className="w-3.5 h-3.5 text-neutral-400" />
            <span className="truncate max-w-[200px] font-medium text-neutral-700">
              {imageMeta.name}
            </span>
            <span className="text-neutral-300">•</span>
            <span>
              {imageMeta.width} × {imageMeta.height}px
            </span>
          </div>
        )}
      </div>

      {imageMeta && (
        <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/80">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-neutral-700 hover:text-neutral-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-neutral-700 hover:text-neutral-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

          <button
            type="button"
            onClick={onClear}
            disabled={!hasAnnotations}
            title="Clear all annotations"
            className="p-1.5 rounded-lg text-neutral-700 hover:text-red-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setShowShortcuts(!showShortcuts)}
          title="Keyboard Shortcuts"
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {imageMeta && (
          <>
            <button
              type="button"
              onClick={onChangeImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer rounded-xl transition-colors border border-transparent hover:border-neutral-200"
            >
              <ImageUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Image</span>
            </button>

            <div className="relative" ref={exportMenuRef}>
              <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-neutral-900 bg-neutral-900 text-white">
                <button
                  type="button"
                  onClick={() => onExport('png')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2 py-1.5 hover:bg-neutral-800 cursor-pointer border-l border-neutral-700 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-xl border border-neutral-200 p-1.5 z-50 text-xs font-medium text-neutral-700 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        onExport('png');
                      }}
                      className="group w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-900 hover:text-white cursor-pointer text-left transition-colors"
                    >
                      <span>Download as PNG</span>
                      <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300 font-mono">Lossless</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        onExport('jpeg');
                      }}
                      className="group w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-900 hover:text-white cursor-pointer text-left transition-colors"
                    >
                      <span>Download as JPG</span>
                      <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300 font-mono">Standard</span>
                    </button>
                    <div className="my-1 border-t border-neutral-100" />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="group w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-900 hover:text-white cursor-pointer text-left transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                        )}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </span>
                    </button>
                  </div>
              )}
            </div>
          </>
        )}
      </div>

      {showShortcuts &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setShowShortcuts(false)}
            />
            <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-sm w-full p-6 text-neutral-900 z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold tracking-tight">Keyboard Shortcuts</h3>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs overflow-y-auto pr-1 flex-1">
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Select tool</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">V</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Crop</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">X</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Saturation</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">S</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Rectangle</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">R</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Arrow</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">A</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Circle</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">C</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Line</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">L</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Pen</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">P</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Text</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">T</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Redact</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">B</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Undo</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">Ctrl + Z</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Redo</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">Ctrl + Y</kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Paste Image</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">Ctrl + V</kbd>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500">Delete selection</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 rounded font-mono font-semibold border border-neutral-200">Del / Backspace</kbd>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Minimalist Image Editor</span>
                <span>
                  Made by{' '}
                  <a
                    href="https://lukaulcar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 hover:text-neutral-950 font-semibold underline underline-offset-2 transition-colors"
                  >
                    lukaulcar.com
                  </a>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="mt-4 w-full py-2 bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
