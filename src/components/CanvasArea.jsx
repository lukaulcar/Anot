import { useRef, useEffect, useState, useCallback } from 'react';
import {
  TOOL_TYPES,
  drawAnnotation,
  isPointInAnnotation,
  getHandleAtPoint,
  getCropHandleAt,
  clone,
  makeId,
} from '../utils/canvas';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Anything smaller than this is a misclick
const MIN_SHAPE_DIST = 4;
const CROP_MIN_SIZE = 20;
const HANDLE_GRAB_DIST = 14;

function ZoomControls({ zoom, setZoom }) {
  return (
    <div className="fixed bottom-6 right-6 z-20 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-lg shadow-neutral-900/5 text-xs text-neutral-700">
      <button
        type="button"
        onClick={() => setZoom((z) => Math.max(0.25, parseFloat((z - 0.15).toFixed(2))))}
        title="Zoom Out"
        className="p-1.5 rounded-lg hover:bg-neutral-900 hover:text-white text-neutral-600 cursor-pointer transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="font-mono text-[11px] font-semibold px-1.5 min-w-[42px] text-center">
        {Math.round(zoom * 100)}%
      </span>

      <button
        type="button"
        onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.15).toFixed(2))))}
        title="Zoom In"
        className="p-1.5 rounded-lg hover:bg-neutral-900 hover:text-white text-neutral-600 cursor-pointer transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-3.5 bg-neutral-200 mx-0.5" />

      <button
        type="button"
        onClick={() => setZoom(1)}
        title="Reset Zoom to 100%"
        className="p-1.5 rounded-lg hover:bg-neutral-900 hover:text-white text-neutral-600 cursor-pointer transition-colors"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CanvasArea({
  imageSrc,
  imageMeta,
  annotations,
  setAnnotations,
  currentTool,
  setTool,
  color,
  strokeWidth,
  filled,
  fontSize,
  selectedId,
  setSelectedId,
  saveHistorySnapshot,
  onImageElementReady,
  cropBox,
  setCropBox,
  saturation = 100,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageElementRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);

  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoverCursor, setHoverCursor] = useState(null);

  const [inlineTextEdit, setInlineTextEdit] = useState(null);
  const inlineTextRef = useRef(null);

  const annotationsRef = useRef(annotations);
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const [zoom, setZoom] = useState(1);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElementRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    if (saturation !== undefined && saturation !== 100) {
      ctx.filter = `saturate(${saturation}%)`;
    }
    ctx.drawImage(imageElementRef.current, 0, 0, cw, ch);
    ctx.restore();
    ctx.filter = 'none';

    for (const ann of annotations) {
      if (inlineTextEdit && inlineTextEdit.id === ann.id) continue;
      const isSelected = ann.id === selectedId;
      drawAnnotation(ctx, ann, 1, isSelected);
    }

    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation, 1, false);
    }

    if (currentTool === TOOL_TYPES.CROP && cropBox) {
      const { x, y, width: w, height: h } = cropBox;

      ctx.save();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
      if (y > 0) ctx.fillRect(0, 0, cw, y);
      if (y + h < ch) ctx.fillRect(0, y + h, cw, ch - (y + h));
      if (x > 0) ctx.fillRect(0, y, x, h);
      if (x + w < cw) ctx.fillRect(x + w, y, cw - (x + w), h);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w / 3, y);
      ctx.lineTo(x + w / 3, y + h);
      ctx.moveTo(x + (2 * w) / 3, y);
      ctx.lineTo(x + (2 * w) / 3, y + h);
      ctx.moveTo(x, y + h / 3);
      ctx.lineTo(x + w, y + h / 3);
      ctx.moveTo(x, y + (2 * h) / 3);
      ctx.lineTo(x + w, y + (2 * h) / 3);
      ctx.stroke();

      const topPillW = Math.max(48, Math.min(100, w * 0.35));
      const topPillH = 10;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x + w / 2 - topPillW / 2, y - topPillH / 2, topPillW, topPillH, 5);
      } else {
        ctx.rect(x + w / 2 - topPillW / 2, y - topPillH / 2, topPillW, topPillH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#737373';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 8, y - 2);
      ctx.lineTo(x + w / 2 + 8, y - 2);
      ctx.moveTo(x + w / 2 - 8, y + 2);
      ctx.lineTo(x + w / 2 + 8, y + 2);
      ctx.stroke();

      const handles = [
        { id: 'crop-bottom', x: x + w / 2, y: y + h },
        { id: 'crop-left', x: x, y: y + h / 2 },
        { id: 'crop-right', x: x + w, y: y + h / 2 },
        { id: 'crop-tl', x: x, y: y },
        { id: 'crop-tr', x: x + w, y: y },
        { id: 'crop-bl', x: x, y: y + h },
        { id: 'crop-br', x: x + w, y: y + h },
      ];

      for (const hnd of handles) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hnd.x, hnd.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [annotations, currentAnnotation, selectedId, currentTool, cropBox, inlineTextEdit, saturation]);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      if (onImageElementReady) {
        onImageElementReady(img);
      }
      renderCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Canvas backing store is full-res, displayed size is smaller.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const commitInlineText = useCallback((targetEdit = inlineTextEdit) => {
    if (!targetEdit) return;
    const trimmed = (targetEdit.text || '').trim();
    const current = annotationsRef.current;

    if (!trimmed) {
      if (targetEdit.id) {
        const next = current.filter((a) => a.id !== targetEdit.id);
        setAnnotations(next);
        saveHistorySnapshot(next);
        setSelectedId(null);
      }
      setInlineTextEdit(null);
      return;
    }

    if (targetEdit.id) {
      const next = current.map((a) =>
        a.id === targetEdit.id
          ? {
              ...a,
              text: trimmed,
              color: targetEdit.color || color,
              fontSize: targetEdit.fontSize || fontSize,
            }
          : a
      );
      setAnnotations(next);
      saveHistorySnapshot(next);
      setSelectedId(targetEdit.id);
    } else {
      const newAnn = {
        id: makeId('text'),
        type: TOOL_TYPES.TEXT,
        startX: targetEdit.canvasX,
        startY: targetEdit.canvasY,
        endX: targetEdit.canvasX,
        endY: targetEdit.canvasY,
        text: trimmed,
        color: targetEdit.color || color,
        fontSize: targetEdit.fontSize || fontSize,
      };

      const next = [...current, newAnn];
      setAnnotations(next);
      saveHistorySnapshot(next);
      setSelectedId(newAnn.id);
      setTool(TOOL_TYPES.SELECT);
    }

    setInlineTextEdit(null);
  }, [inlineTextEdit, saveHistorySnapshot, color, fontSize, setAnnotations, setSelectedId, setTool]);

  const cancelInlineText = useCallback(() => {
    setInlineTextEdit(null);
  }, []);

  const startInlineEditing = useCallback((target) => {
    if (inlineTextEdit && inlineTextEdit.text.trim()) {
      commitInlineText(inlineTextEdit);
    }

    setInlineTextEdit({
      id: target.id || null,
      canvasX: target.startX ?? target.canvasX ?? 0,
      canvasY: target.startY ?? target.canvasY ?? 0,
      text: target.text || '',
      fontSize: target.fontSize || fontSize,
      color: target.color || color,
    });

    if (target.id) {
      setSelectedId(target.id);
    }
  }, [inlineTextEdit, commitInlineText, color, fontSize, setSelectedId]);

  const justCreatedRef = useRef(false);

  useEffect(() => {
    if (inlineTextEdit && inlineTextRef.current) {
      const el = inlineTextRef.current;
      justCreatedRef.current = true;
      const timer = setTimeout(() => {
        justCreatedRef.current = false;
      }, 350);

      requestAnimationFrame(() => {
        el.focus();
        if (el.value) {
          el.setSelectionRange(el.value.length, el.value.length);
        }
      });

      el.style.height = 'auto';
      el.style.height = `${Math.max(28, el.scrollHeight)}px`;
      el.style.width = 'auto';
      el.style.width = `${Math.max(120, el.scrollWidth + 16)}px`;

      return () => clearTimeout(timer);
    }
  }, [inlineTextEdit]);

  const handleBlur = () => {
    if (justCreatedRef.current) {
      inlineTextRef.current?.focus();
      return;
    }
    commitInlineText();
  };

  const handleInlineTextChange = (e) => {
    justCreatedRef.current = false;
    const val = e.target.value;
    setInlineTextEdit((prev) => (prev ? { ...prev, text: val } : null));
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.max(28, el.scrollHeight)}px`;
    el.style.width = 'auto';
    el.style.width = `${Math.max(120, el.scrollWidth + 16)}px`;
  };

  const handleDoubleClick = (e) => {
    if (currentTool === TOOL_TYPES.CROP) return;
    const { x, y } = getCanvasCoords(e);
    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];
      if (ann.type === TOOL_TYPES.TEXT && isPointInAnnotation(x, y, ann)) {
        e.preventDefault();
        if (inlineTextEdit) commitInlineText(inlineTextEdit);
        startInlineEditing(ann);
        break;
      }
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const { x, y } = getCanvasCoords(e);

    if (currentTool === TOOL_TYPES.SATURATION) {
      return;
    }

    if (currentTool === TOOL_TYPES.CROP) {
      if (!cropBox) return;
      const handle = getCropHandleAt(x, y, cropBox);

      if (handle) {
        setActiveHandle(handle);
        setDragOffset({
          startX: x,
          startY: y,
          initialCrop: { ...cropBox },
        });
      } else {
        setActiveHandle('crop-new');
        setDragOffset({
          startX: x,
          startY: y,
          initialCrop: { x, y, width: 10, height: 10 },
        });
        setCropBox({ x, y, width: 10, height: 10 });
      }
      return;
    }

    const selectedAnn = annotations.find((a) => a.id === selectedId);

    if (selectedAnn) {
      const handle = getHandleAtPoint(x, y, selectedAnn, 1, HANDLE_GRAB_DIST);
      if (handle) {
        setActiveHandle(handle.id);
        setDragOffset({
          startX: x,
          startY: y,
          initialAnn: clone(selectedAnn),
        });
        return;
      }
    }

    let clickedAnnotation = null;
    for (let i = annotations.length - 1; i >= 0; i--) {
      if (isPointInAnnotation(x, y, annotations[i])) {
        clickedAnnotation = annotations[i];
        break;
      }
    }

    if (clickedAnnotation) {
      if (inlineTextEdit) commitInlineText(inlineTextEdit);
      setSelectedId(clickedAnnotation.id);
      setIsDraggingSelected(true);
      setDragOffset({
        startX: x,
        startY: y,
        initialAnn: clone(clickedAnnotation),
      });
      if (currentTool !== TOOL_TYPES.SELECT) {
        setTool(TOOL_TYPES.SELECT);
      }
      return;
    }

    if (currentTool === TOOL_TYPES.TEXT) {
      e.preventDefault();
      if (inlineTextEdit) commitInlineText(inlineTextEdit);
      startInlineEditing({
        id: null,
        canvasX: x,
        canvasY: y,
        text: '',
        color,
        fontSize,
      });
      return;
    }

    if (inlineTextEdit) commitInlineText(inlineTextEdit);
    setSelectedId(null);

    if (currentTool === TOOL_TYPES.SELECT) {
      return;
    }

    setIsDrawing(true);

    const baseAnn = {
      id: makeId('ann'),
      type: currentTool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color,
      strokeWidth,
      filled,
      fontSize,
    };

    if (currentTool === TOOL_TYPES.PEN) {
      baseAnn.points = [{ x, y }];
    }

    setCurrentAnnotation(baseAnn);
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const maxW = canvas ? canvas.width : (imageMeta?.width || 1200);
    const maxH = canvas ? canvas.height : (imageMeta?.height || 800);

    if (currentTool === TOOL_TYPES.CROP) {
      if (activeHandle && dragOffset.initialCrop) {
        const init = dragOffset.initialCrop;
        const dx = x - dragOffset.startX;
        const dy = y - dragOffset.startY;

        let nextX = init.x;
        let nextY = init.y;
        let nextW = init.width;
        let nextH = init.height;

        if (activeHandle === 'crop-top') {
          const newY = Math.max(0, Math.min(init.y + init.height - CROP_MIN_SIZE, init.y + dy));
          nextY = newY;
          nextH = init.y + init.height - newY;
        } else if (activeHandle === 'crop-bottom') {
          nextH = Math.max(CROP_MIN_SIZE, Math.min(maxH - init.y, init.height + dy));
        } else if (activeHandle === 'crop-left') {
          const newX = Math.max(0, Math.min(init.x + init.width - CROP_MIN_SIZE, init.x + dx));
          nextX = newX;
          nextW = init.x + init.width - newX;
        } else if (activeHandle === 'crop-right') {
          nextW = Math.max(CROP_MIN_SIZE, Math.min(maxW - init.x, init.width + dx));
        } else if (activeHandle === 'crop-tl') {
          const newX = Math.max(0, Math.min(init.x + init.width - CROP_MIN_SIZE, init.x + dx));
          const newY = Math.max(0, Math.min(init.y + init.height - CROP_MIN_SIZE, init.y + dy));
          nextX = newX;
          nextY = newY;
          nextW = init.x + init.width - newX;
          nextH = init.y + init.height - newY;
        } else if (activeHandle === 'crop-tr') {
          const newY = Math.max(0, Math.min(init.y + init.height - CROP_MIN_SIZE, init.y + dy));
          nextY = newY;
          nextW = Math.max(CROP_MIN_SIZE, Math.min(maxW - init.x, init.width + dx));
          nextH = init.y + init.height - newY;
        } else if (activeHandle === 'crop-bl') {
          const newX = Math.max(0, Math.min(init.x + init.width - CROP_MIN_SIZE, init.x + dx));
          nextX = newX;
          nextW = init.x + init.width - newX;
          nextH = Math.max(CROP_MIN_SIZE, Math.min(maxH - init.y, init.height + dy));
        } else if (activeHandle === 'crop-br') {
          nextW = Math.max(CROP_MIN_SIZE, Math.min(maxW - init.x, init.width + dx));
          nextH = Math.max(CROP_MIN_SIZE, Math.min(maxH - init.y, init.height + dy));
        } else if (activeHandle === 'crop-inside') {
          nextX = Math.max(0, Math.min(maxW - init.width, init.x + dx));
          nextY = Math.max(0, Math.min(maxH - init.height, init.y + dy));
        } else if (activeHandle === 'crop-new') {
          nextX = Math.min(dragOffset.startX, x);
          nextY = Math.min(dragOffset.startY, y);
          nextW = Math.abs(x - dragOffset.startX);
          nextH = Math.abs(y - dragOffset.startY);
        }

        setCropBox({
          x: Math.round(nextX),
          y: Math.round(nextY),
          width: Math.round(nextW),
          height: Math.round(nextH),
        });
        return;
      }

      const handle = getCropHandleAt(x, y, cropBox);
      if (handle === 'crop-top' || handle === 'crop-bottom') {
        setHoverCursor('ns-resize');
      } else if (handle === 'crop-left' || handle === 'crop-right') {
        setHoverCursor('ew-resize');
      } else if (handle === 'crop-tl' || handle === 'crop-br') {
        setHoverCursor('nwse-resize');
      } else if (handle === 'crop-tr' || handle === 'crop-bl') {
        setHoverCursor('nesw-resize');
      } else if (handle === 'crop-inside') {
        setHoverCursor('move');
      } else {
        setHoverCursor('crosshair');
      }
      return;
    }

    if (activeHandle && dragOffset.initialAnn) {
      const init = dragOffset.initialAnn;
      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id !== init.id) return ann;

          if (ann.type === TOOL_TYPES.ARROW || ann.type === TOOL_TYPES.LINE) {
            if (activeHandle === 'end') return { ...ann, endX: x, endY: y };
            if (activeHandle === 'start') return { ...ann, startX: x, startY: y };
          }

          if (ann.type === TOOL_TYPES.RECTANGLE || ann.type === TOOL_TYPES.REDACT) {
            if (activeHandle === 'tl') return { ...ann, startX: x, startY: y };
            if (activeHandle === 'br') return { ...ann, endX: x, endY: y };
            if (activeHandle === 'tr') return { ...ann, endX: x, startY: y };
            if (activeHandle === 'bl') return { ...ann, startX: x, endY: y };
          }

          if (ann.type === TOOL_TYPES.CIRCLE) {
            if (activeHandle === 'right') return { ...ann, endX: x };
            if (activeHandle === 'left') return { ...ann, startX: x };
            if (activeHandle === 'bottom') return { ...ann, endY: y };
            if (activeHandle === 'top') return { ...ann, startY: y };
          }

          return ann;
        })
      );
      return;
    }

    if (isDraggingSelected && dragOffset.initialAnn) {
      const dx = x - dragOffset.startX;
      const dy = y - dragOffset.startY;
      const init = dragOffset.initialAnn;

      setAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id !== init.id) return ann;
          if (ann.type === TOOL_TYPES.PEN && init.points) {
            return {
              ...ann,
              points: init.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }
          return {
            ...ann,
            startX: init.startX + dx,
            startY: init.startY + dy,
            endX: init.endX + dx,
            endY: init.endY + dy,
          };
        })
      );
      return;
    }

    if (isDrawing && currentAnnotation) {
      if (currentAnnotation.type === TOOL_TYPES.PEN) {
        setCurrentAnnotation((prev) => ({
          ...prev,
          points: [...prev.points, { x, y }],
        }));
      } else {
        setCurrentAnnotation((prev) => ({
          ...prev,
          endX: x,
          endY: y,
        }));
      }
      return;
    }

    const selectedAnn = annotations.find((a) => a.id === selectedId);
    if (selectedAnn) {
      const handle = getHandleAtPoint(x, y, selectedAnn, 1, HANDLE_GRAB_DIST);
      if (handle) {
        setHoverCursor(handle.cursor || 'pointer');
        return;
      }
    }

    let isOverAny = false;
    for (let i = annotations.length - 1; i >= 0; i--) {
      if (isPointInAnnotation(x, y, annotations[i])) {
        isOverAny = true;
        break;
      }
    }

    if (isOverAny) {
      setHoverCursor('move');
    } else {
      setHoverCursor(null);
    }
  };

  const handleMouseUp = () => {
    if (currentTool === TOOL_TYPES.CROP) {
      if (activeHandle) {
        setActiveHandle(null);
        setDragOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (activeHandle) {
      setActiveHandle(null);
      setDragOffset({ x: 0, y: 0 });
      saveHistorySnapshot(annotationsRef.current);
      return;
    }

    if (isDraggingSelected) {
      setIsDraggingSelected(false);
      setDragOffset({ x: 0, y: 0 });
      saveHistorySnapshot(annotationsRef.current);
      return;
    }

    if (isDrawing && currentAnnotation) {
      setIsDrawing(false);

      let isValid = false;
      if (currentAnnotation.type === TOOL_TYPES.PEN) {
        isValid = currentAnnotation.points && currentAnnotation.points.length > 2;
      } else {
        const dist = Math.hypot(
          currentAnnotation.endX - currentAnnotation.startX,
          currentAnnotation.endY - currentAnnotation.startY
        );
        isValid = dist > MIN_SHAPE_DIST;
      }

      if (isValid) {
        const nextAnnotations = [...annotations, currentAnnotation];
        setAnnotations(nextAnnotations);
        setSelectedId(currentAnnotation.id);
        saveHistorySnapshot(nextAnnotations);
      }

      setCurrentAnnotation(null);
    }
  };

  const getCursorStyle = () => {
    if (hoverCursor) return hoverCursor;
    if (currentTool === TOOL_TYPES.CROP) return 'crosshair';
    if (isDraggingSelected) return 'grabbing';
    if (currentTool === TOOL_TYPES.SELECT || currentTool === TOOL_TYPES.SATURATION) return 'default';
    if (currentTool === TOOL_TYPES.TEXT) return 'text';
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-[calc(100vh-64px)] overflow-auto canvas-grid-pattern flex items-center justify-center p-6 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className="relative inline-block transition-transform duration-150 ease-out origin-center"
        style={{ transform: `scale(${zoom})` }}
      >
        <canvas
          ref={canvasRef}
          width={imageMeta ? imageMeta.width : 800}
          height={imageMeta ? imageMeta.height : 600}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: getCursorStyle() }}
          className="block bg-white shadow-2xl rounded-sm border border-neutral-300 max-w-[85vw] max-h-[78vh] object-contain"
        />

        {inlineTextEdit && canvasRef.current && (() => {
          const cw = canvasRef.current.width || 800;
          const ch = canvasRef.current.height || 600;
          const clientW = canvasRef.current.clientWidth || cw;
          const clientH = canvasRef.current.clientHeight || ch;
          const scaleX = clientW / cw;
          const scaleY = clientH / ch;
          const left = inlineTextEdit.canvasX * scaleX;
          const top = inlineTextEdit.canvasY * scaleY;
          const editFontSize = Math.max(13, (inlineTextEdit.fontSize || fontSize) * scaleY);
          const activeColor = inlineTextEdit.color || color;

          return (
            <textarea
              ref={inlineTextRef}
              rows={1}
              value={inlineTextEdit.text}
              onChange={handleInlineTextChange}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitInlineText();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelInlineText();
                }
              }}
              onBlur={handleBlur}
              placeholder="Type here..."
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                minWidth: '120px',
                minHeight: '28px',
                fontSize: `${editFontSize}px`,
                lineHeight: 1.25,
                fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontWeight: 600,
                color: activeColor,
                caretColor: activeColor,
                textShadow:
                  activeColor === '#ffffff'
                    ? '0 1px 3px rgba(0, 0, 0, 0.8)'
                    : '0 1px 3px rgba(255, 255, 255, 0.85)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1.5px dashed rgba(100, 116, 139, 0.4)',
                borderRadius: '0px',
                padding: '0 2px',
                margin: 0,
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                whiteSpace: 'pre',
                zIndex: 40,
              }}
            />
          );
        })()}
      </div>

      <ZoomControls zoom={zoom} setZoom={setZoom} />
    </div>
  );
}
