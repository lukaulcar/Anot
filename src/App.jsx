import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dropzone from './components/Dropzone';
import Toolbar from './components/Toolbar';
import StyleBar from './components/StyleBar';
import CropBar from './components/CropBar';
import SaturationBar from './components/SaturationBar';
import CanvasArea from './components/CanvasArea';
import {
  TOOL_TYPES,
  COLOR_PALETTE,
  exportAnnotatedImage,
  cropImage,
  clone,
  makeId,
} from './utils/canvas';
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
} from './utils/storage';

// Cap history so a long session doesn't eat memory.
const HISTORY_LIMIT = 60;

export default function App() {
  const [imageMeta, setImageMeta] = useState(null);
  const [imageElement, setImageElement] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [historyStack, setHistoryStack] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [currentTool, setTool] = useState(TOOL_TYPES.RECTANGLE);
  const [color, setColor] = useState(COLOR_PALETTE[0].value);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [filled, setFilled] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [saturation, setSaturation] = useState(100);
  const [selectedId, setSelectedId] = useState(null);

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const [cropBox, setCropBox] = useState(null);

  useEffect(() => {
    let active = true;
    async function initStorage() {
      try {
        const saved = await loadSessionState();
        if (active && saved && saved.imageMeta) {
          setImageMeta(saved.imageMeta);
          if (saved.annotations) setAnnotations(saved.annotations);
          if (saved.historyStack && saved.historyStack.length > 0) {
            setHistoryStack(saved.historyStack);
            setHistoryIndex(saved.historyIndex ?? saved.historyStack.length - 1);
          }
          if (saved.currentTool && saved.currentTool !== TOOL_TYPES.CROP && saved.currentTool !== TOOL_TYPES.SATURATION) {
            setTool(saved.currentTool);
          }
          if (saved.color) setColor(saved.color);
          if (saved.strokeWidth) setStrokeWidth(saved.strokeWidth);
          if (saved.filled !== undefined) setFilled(saved.filled);
          if (saved.fontSize) setFontSize(saved.fontSize);
          if (saved.saturation !== undefined) setSaturation(saved.saturation);
        }
      } catch (err) {
        console.warn('Failed to restore session state:', err);
      } finally {
        if (active) {
          setIsStorageLoaded(true);
        }
      }
    }
    initStorage();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isStorageLoaded) return;

    if (!imageMeta) {
      clearSessionState();
      return;
    }

    const timer = setTimeout(() => {
      saveSessionState({
        imageMeta,
        annotations,
        historyStack,
        historyIndex,
        currentTool: (currentTool === TOOL_TYPES.CROP || currentTool === TOOL_TYPES.SATURATION) ? TOOL_TYPES.SELECT : currentTool,
        color,
        strokeWidth,
        filled,
        fontSize,
        saturation,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    isStorageLoaded,
    imageMeta,
    annotations,
    historyStack,
    historyIndex,
    currentTool,
    color,
    strokeWidth,
    filled,
    fontSize,
    saturation,
  ]);

  useEffect(() => {
    if (currentTool === TOOL_TYPES.CROP && imageMeta) {
      setCropBox({
        x: 0,
        y: 0,
        width: imageMeta.width,
        height: imageMeta.height,
      });
      setSelectedId(null);
    }
  }, [currentTool, imageMeta]);

  const saveHistorySnapshot = useCallback((newAnnotations) => {
    const snapshot = clone(newAnnotations);
    setHistoryStack((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const next = [...sliced, snapshot];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, HISTORY_LIMIT - 1));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setAnnotations(clone(historyStack[nextIndex]));
      setSelectedId(null);
    }
  }, [historyIndex, historyStack]);

  const handleRedo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setAnnotations(clone(historyStack[nextIndex]));
      setSelectedId(null);
    }
  }, [historyIndex, historyStack]);

  const handleClear = () => {
    if (annotations.length === 0) return;
    if (window.confirm('Are you sure you want to clear all annotations?')) {
      const empty = [];
      setAnnotations(empty);
      setSelectedId(null);
      saveHistorySnapshot(empty);
    }
  };

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    const next = annotations.filter((a) => a.id !== selectedId);
    setAnnotations(next);
    setSelectedId(null);
    saveHistorySnapshot(next);
  }, [selectedId, annotations, saveHistorySnapshot]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const item = annotations.find((a) => a.id === selectedId);
    if (!item) return;

    const offset = 20;
    const dup = {
      ...clone(item),
      id: makeId('ann'),
      startX: (item.startX || 0) + offset,
      startY: (item.startY || 0) + offset,
      endX: (item.endX || 0) + offset,
      endY: (item.endY || 0) + offset,
    };

    if (dup.points) {
      dup.points = dup.points.map((p) => ({ x: p.x + offset, y: p.y + offset }));
    }

    const next = [...annotations, dup];
    setAnnotations(next);
    setSelectedId(dup.id);
    saveHistorySnapshot(next);
  }, [selectedId, annotations, saveHistorySnapshot]);

  const handleImageSelected = (meta) => {
    setImageMeta(meta);
    setAnnotations([]);
    setHistoryStack([[]]);
    setHistoryIndex(0);
    setSelectedId(null);
    setCropBox(null);
    setSaturation(100);
  };

  const handleChangeImage = () => {
    if (annotations.length > 0) {
      if (!window.confirm('Upload a new image? Current annotations will be discarded.')) {
        return;
      }
    }
    clearSessionState();
    setImageMeta(null);
    setImageElement(null);
    setAnnotations([]);
    setHistoryStack([[]]);
    setHistoryIndex(0);
    setSelectedId(null);
    setCropBox(null);
    setSaturation(100);
  };

  const handleApplyCrop = useCallback(async () => {
    if (!imageElement || !imageMeta || !cropBox) return;

    try {
      const result = await cropImage({
        imageElement,
        cropBox,
        annotations,
      });

      const nextMeta = {
        ...imageMeta,
        src: result.src,
        width: result.width,
        height: result.height,
      };

      const croppedAnnotations = clone(result.annotations);

      setImageMeta(nextMeta);
      setAnnotations(croppedAnnotations);
      setSelectedId(null);
      setTool(TOOL_TYPES.SELECT);
      setHistoryStack([croppedAnnotations]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Crop failed:', err);
      alert('Failed to crop image.');
    }
  }, [imageElement, imageMeta, cropBox, annotations]);

  const handleCancelCrop = () => {
    setTool(TOOL_TYPES.SELECT);
  };

  const handleTrimTopPercent = (pct) => {
    if (!imageMeta) return;
    const cutY = Math.round(imageMeta.height * pct);
    setCropBox((prev) => {
      const curX = prev?.x || 0;
      const curW = prev?.width || imageMeta.width;
      return {
        x: curX,
        y: cutY,
        width: curW,
        height: imageMeta.height - cutY,
      };
    });
  };

  const handleResetCrop = () => {
    if (!imageMeta) return;
    setCropBox({
      x: 0,
      y: 0,
      width: imageMeta.width,
      height: imageMeta.height,
    });
  };

  const handleExport = useCallback(async (format = 'png') => {
    if (!imageElement || !imageMeta) return;

    try {
      const blob = await exportAnnotatedImage({
        imageElement,
        annotations,
        format,
        saturation,
        quality: 0.95,
        baseWidth: imageMeta.width,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const baseName = (imageMeta.name || 'image').replace(/\.[^/.]+$/, '');
      link.download = `${baseName}-annotated.${format}`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image. Please try again.');
    }
  }, [imageElement, imageMeta, annotations, saturation]);

  const handleCopyClipboard = async () => {
    if (!imageElement || !imageMeta) return false;

    try {
      // ClipboardItem + image/png only exists in Chromium over HTTPS/localhost.
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        alert('Clipboard copy needs Chrome or Edge over HTTPS/localhost.');
        return false;
      }

      const blobPromise = exportAnnotatedImage({
        imageElement,
        annotations,
        format: 'png',
        saturation,
        baseWidth: imageMeta.width,
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobPromise }),
      ]);
      return true;
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      if (err?.name === 'NotAllowedError') {
        alert('Clipboard write was blocked. Click the page once to focus it, allow clipboard access, and try again (requires HTTPS or localhost).');
      } else {
        alert('Failed to copy image to clipboard. Please try again.');
      }
      return false;
    }
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                handleImageSelected({
                  src: event.target.result,
                  name: `clipboard-image-${Date.now()}.png`,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  type: 'image/png',
                  size: file.size,
                });
              };
              img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      if (currentTool === TOOL_TYPES.CROP) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyCrop();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelCrop();
          return;
        }
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (
        (isCtrlOrCmd && e.key.toLowerCase() === 'y') ||
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExport('png');
        return;
      }

      if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        setTool(TOOL_TYPES.SELECT);
        return;
      }

      if (!isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setTool(TOOL_TYPES.SELECT);
            break;
          case 'x':
            setTool(TOOL_TYPES.CROP);
            break;
          case 's':
            setTool(TOOL_TYPES.SATURATION);
            break;
          case 'r':
            setTool(TOOL_TYPES.RECTANGLE);
            break;
          case 'a':
            setTool(TOOL_TYPES.ARROW);
            break;
          case 'c':
            setTool(TOOL_TYPES.CIRCLE);
            break;
          case 'l':
            setTool(TOOL_TYPES.LINE);
            break;
          case 'p':
            setTool(TOOL_TYPES.PEN);
            break;
          case 't':
            setTool(TOOL_TYPES.TEXT);
            break;
          case 'b':
            setTool(TOOL_TYPES.REDACT);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleApplyCrop,
    handleExport,
    selectedId,
    currentTool,
    imageElement,
    imageMeta,
    annotations,
    cropBox,
  ]);

  const selectedAnnotation = annotations.find((a) => a.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {imageMeta && (
        <Navbar
          imageMeta={imageMeta}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < historyStack.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onChangeImage={handleChangeImage}
          onExport={handleExport}
          onCopyClipboard={handleCopyClipboard}
          hasAnnotations={annotations.length > 0}
        />
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!imageMeta ? (
          <Dropzone onImageSelected={handleImageSelected} />
        ) : (
          <>
            <Toolbar
              currentTool={currentTool}
              setTool={setTool}
              saturation={saturation}
            />

            {currentTool === TOOL_TYPES.CROP ? (
              <CropBar
                imageMeta={imageMeta}
                cropBox={cropBox}
                onApplyCrop={handleApplyCrop}
                onCancelCrop={handleCancelCrop}
                onTrimTopPercent={handleTrimTopPercent}
                onResetCrop={handleResetCrop}
              />
            ) : currentTool === TOOL_TYPES.SATURATION ? (
              <SaturationBar
                saturation={saturation}
                setSaturation={setSaturation}
                onDone={() => setTool(TOOL_TYPES.SELECT)}
              />
            ) : (
              <StyleBar
                color={color}
                setColor={(c) => {
                  setColor(c);
                  if (selectedId) {
                    const next = annotations.map((a) => (a.id === selectedId ? { ...a, color: c } : a));
                    setAnnotations(next);
                    saveHistorySnapshot(next);
                  }
                }}
                strokeWidth={strokeWidth}
                setStrokeWidth={(w) => {
                  setStrokeWidth(w);
                  if (selectedId) {
                    const next = annotations.map((a) => (a.id === selectedId ? { ...a, strokeWidth: w } : a));
                    setAnnotations(next);
                    saveHistorySnapshot(next);
                  }
                }}
                filled={filled}
                setFilled={(f) => {
                  setFilled(f);
                  if (selectedId) {
                    const next = annotations.map((a) => (a.id === selectedId ? { ...a, filled: f } : a));
                    setAnnotations(next);
                    saveHistorySnapshot(next);
                  }
                }}
                fontSize={fontSize}
                setFontSize={(s) => {
                  setFontSize(s);
                  if (selectedId) {
                    const next = annotations.map((a) => (a.id === selectedId ? { ...a, fontSize: s } : a));
                    setAnnotations(next);
                    saveHistorySnapshot(next);
                  }
                }}
                currentTool={currentTool}
                selectedAnnotation={selectedAnnotation}
                onDeleteSelected={handleDeleteSelected}
                onDuplicateSelected={handleDuplicateSelected}
              />
            )}

            <CanvasArea
              imageSrc={imageMeta.src}
              imageMeta={imageMeta}
              annotations={annotations}
              setAnnotations={setAnnotations}
              currentTool={currentTool}
              setTool={setTool}
              color={color}
              strokeWidth={strokeWidth}
              filled={filled}
              fontSize={fontSize}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              saveHistorySnapshot={saveHistorySnapshot}
              onImageElementReady={setImageElement}
              cropBox={cropBox}
              setCropBox={setCropBox}
              saturation={saturation}
            />
          </>
        )}
      </main>

      <a
        href="https://lukaulcar.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-3 left-4 z-20 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 bg-white/85 hover:bg-white backdrop-blur-md px-3 py-1 rounded-full border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 group"
      >
        <span>Made by</span>
        <span className="font-semibold text-neutral-700 group-hover:text-neutral-950 underline underline-offset-2">lukaulcar.com</span>
      </a>
    </div>
  );
}
