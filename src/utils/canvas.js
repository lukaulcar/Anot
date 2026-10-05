export const TOOL_TYPES = {
  SELECT: 'select',
  RECTANGLE: 'rectangle',
  ARROW: 'arrow',
  CIRCLE: 'circle',
  LINE: 'line',
  PEN: 'pen',
  TEXT: 'text',
  REDACT: 'redact',
  CROP: 'crop',
  SATURATION: 'saturation',
};

export const COLOR_PALETTE = [
  { label: 'White', value: '#ffffff', border: '#000000' },
  { label: 'Black', value: '#000000', border: '#ffffff' },
  { label: 'Red', value: '#ef4444', border: '#ffffff' },
  { label: 'Blue', value: '#2563eb', border: '#ffffff' },
  { label: 'Amber', value: '#f59e0b', border: '#ffffff' },
  { label: 'Green', value: '#10b981', border: '#ffffff' },
];

// Small helpers I got tired of rewriting. structuredClone is in every
// browser I care about, JSON fallback is just there for safety.
export function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function makeId(prefix = 'ann') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export const STROKE_WIDTHS = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Bold', value: 8 },
  { label: 'Heavy', value: 14 },
];

export function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

export function getAnnotationHandles(annotation, scale = 1) {
  const { type, startX, startY, endX, endY } = annotation;
  const sStartX = startX * scale;
  const sStartY = startY * scale;
  const sEndX = endX * scale;
  const sEndY = endY * scale;

  if (type === TOOL_TYPES.ARROW || type === TOOL_TYPES.LINE) {
    return [
      { id: 'start', x: sStartX, y: sStartY, cursor: 'crosshair' },
      { id: 'end', x: sEndX, y: sEndY, cursor: 'crosshair' },
    ];
  }

  if (type === TOOL_TYPES.RECTANGLE || type === TOOL_TYPES.REDACT) {
    const minX = Math.min(sStartX, sEndX);
    const maxX = Math.max(sStartX, sEndX);
    const minY = Math.min(sStartY, sEndY);
    const maxY = Math.max(sStartY, sEndY);

    return [
      { id: 'tl', x: minX, y: minY, cursor: 'nwse-resize' },
      { id: 'tr', x: maxX, y: minY, cursor: 'nesw-resize' },
      { id: 'bl', x: minX, y: maxY, cursor: 'nesw-resize' },
      { id: 'br', x: maxX, y: maxY, cursor: 'nwse-resize' },
    ];
  }

  if (type === TOOL_TYPES.CIRCLE) {
    const minX = Math.min(sStartX, sEndX);
    const maxX = Math.max(sStartX, sEndX);
    const minY = Math.min(sStartY, sEndY);
    const maxY = Math.max(sStartY, sEndY);
    return [
      { id: 'left', x: minX, y: (minY + maxY) / 2, cursor: 'ew-resize' },
      { id: 'right', x: maxX, y: (minY + maxY) / 2, cursor: 'ew-resize' },
      { id: 'top', x: (minX + maxX) / 2, y: minY, cursor: 'ns-resize' },
      { id: 'bottom', x: (minX + maxX) / 2, y: maxY, cursor: 'ns-resize' },
    ];
  }

  return [];
}

export function getHandleAtPoint(px, py, annotation, scale = 1, tolerance = 12) {
  const handles = getAnnotationHandles(annotation, scale);
  for (const h of handles) {
    if (Math.hypot(px - h.x, py - h.y) <= tolerance * scale) {
      return h;
    }
  }
  return null;
}

// Crop-box hit testing used by CanvasArea. Kept here so the
// component stays about drawing, not geometry.
export function getCropHandleAt(px, py, box) {
  if (!box) return null;
  const { x, y, width: w, height: h } = box;
  const tol = 14;

  if (Math.abs(py - y) <= tol && px >= x - tol && px <= x + w + tol) {
    if (px <= x + tol) return 'crop-tl';
    if (px >= x + w - tol) return 'crop-tr';
    return 'crop-top';
  }

  if (Math.abs(py - (y + h)) <= tol && px >= x - tol && px <= x + w + tol) {
    if (px <= x + tol) return 'crop-bl';
    if (px >= x + w - tol) return 'crop-br';
    return 'crop-bottom';
  }

  if (Math.abs(px - x) <= tol && py >= y - tol && py <= y + h + tol) {
    return 'crop-left';
  }

  if (Math.abs(px - (x + w)) <= tol && py >= y - tol && py <= y + h + tol) {
    return 'crop-right';
  }

  if (px > x && px < x + w && py > y && py < y + h) {
    return 'crop-inside';
  }

  return null;
}

export function drawAnnotation(ctx, annotation, scale = 1, isSelected = false) {
  const {
    type,
    startX,
    startY,
    endX,
    endY,
    color = '#000000',
    strokeWidth = 4,
    filled = false,
    points = [],
    text = '',
    fontSize = 18,
  } = annotation;

  const sStartX = startX * scale;
  const sStartY = startY * scale;
  const sEndX = endX * scale;
  const sEndY = endY * scale;
  const sStroke = Math.max(1, strokeWidth * scale);
  const sFontSize = fontSize * scale;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = sStroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case TOOL_TYPES.RECTANGLE: {
      const x = Math.min(sStartX, sEndX);
      const y = Math.min(sStartY, sEndY);
      const w = Math.abs(sEndX - sStartX);
      const h = Math.abs(sEndY - sStartY);
      const r = Math.min(6 * scale, w / 4, h / 4);

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
      if (filled) {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case TOOL_TYPES.CIRCLE: {
      const rx = Math.abs(sEndX - sStartX) / 2;
      const ry = Math.abs(sEndY - sStartY) / 2;
      const cx = (sStartX + sEndX) / 2;
      const cy = (sStartY + sEndY) / 2;

      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      if (filled) {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case TOOL_TYPES.LINE: {
      ctx.beginPath();
      ctx.moveTo(sStartX, sStartY);
      ctx.lineTo(sEndX, sEndY);
      ctx.stroke();
      break;
    }

    case TOOL_TYPES.ARROW: {
      const dx = sEndX - sStartX;
      const dy = sEndY - sStartY;
      const length = Math.hypot(dx, dy);

      if (length < 3) break;

      const angle = Math.atan2(dy, dx);
      const headLength = Math.max(14 * scale, sStroke * 3.2);
      const headAngle = Math.PI / 7;

      const stemLength = Math.max(0, length - headLength * 0.7);
      const stemEndX = sStartX + stemLength * Math.cos(angle);
      const stemEndY = sStartY + stemLength * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(sStartX, sStartY);
      ctx.lineTo(stemEndX, stemEndY);
      ctx.stroke();

      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sEndX, sEndY);
      ctx.lineTo(
        sEndX - headLength * Math.cos(angle - headAngle),
        sEndY - headLength * Math.sin(angle - headAngle)
      );
      ctx.lineTo(
        sEndX - (headLength * 0.72) * Math.cos(angle),
        sEndY - (headLength * 0.72) * Math.sin(angle)
      );
      ctx.lineTo(
        sEndX - headLength * Math.cos(angle + headAngle),
        sEndY - headLength * Math.sin(angle + headAngle)
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }

    case TOOL_TYPES.PEN: {
      if (!points || points.length === 0) break;
      ctx.beginPath();
      ctx.moveTo(points[0].x * scale, points[0].y * scale);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scale, points[i].y * scale);
      }
      ctx.stroke();
      break;
    }

    case TOOL_TYPES.TEXT: {
      if (!text) break;
      ctx.save();
      ctx.font = `600 ${sFontSize}px 'Inter', system-ui, -apple-system, sans-serif`;
      ctx.textBaseline = 'top';

      ctx.shadowColor = color === '#ffffff' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 3 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1 * scale;

      ctx.fillStyle = color;
      const lines = text.split('\n');
      const lineHeight = sFontSize * 1.25;
      lines.forEach((line, idx) => {
        ctx.fillText(line, sStartX, sStartY + idx * lineHeight);
      });
      ctx.restore();
      break;
    }

    case TOOL_TYPES.REDACT: {
      const x = Math.min(sStartX, sEndX);
      const y = Math.min(sStartY, sEndY);
      const w = Math.abs(sEndX - sStartX);
      const h = Math.abs(sEndY - sStartY);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      for (let i = -h; i < w + h; i += 16 * scale) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
      }
      ctx.stroke();

      if (w > 60 * scale && h > 20 * scale) {
        ctx.font = `700 ${Math.min(11 * scale, h / 2)}px monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('REDACTED', x + w / 2, y + h / 2);
      }
      break;
    }

    default:
      break;
  }

  if (isSelected) {
    ctx.restore();
    ctx.save();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([4 * scale, 4 * scale]);

    const bounds = getAnnotationBounds(annotation, scale);
    if (bounds && type !== TOOL_TYPES.ARROW && type !== TOOL_TYPES.LINE) {
      if (type === TOOL_TYPES.TEXT) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5 * scale;
        ctx.setLineDash([4 * scale, 3 * scale]);
        ctx.strokeRect(
          bounds.x - 4 * scale,
          bounds.y - 4 * scale,
          bounds.w + 8 * scale,
          bounds.h + 8 * scale
        );

        const corners = [
          { x: bounds.x - 4 * scale, y: bounds.y - 4 * scale },
          { x: bounds.x + bounds.w + 4 * scale, y: bounds.y - 4 * scale },
          { x: bounds.x - 4 * scale, y: bounds.y + bounds.h + 4 * scale },
          { x: bounds.x + bounds.w + 4 * scale, y: bounds.y + bounds.h + 4 * scale },
        ];
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5 * scale;
        for (const c of corners) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 3.5 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else {
        ctx.strokeRect(
          bounds.x - 6 * scale,
          bounds.y - 6 * scale,
          bounds.w + 12 * scale,
          bounds.h + 12 * scale
        );
      }
    }

    const handles = getAnnotationHandles(annotation, scale);
    ctx.setLineDash([]);
    for (const h of handles) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

let measureCanvas = null;
let measureCtx = null;

export function getTextMetrics(text, fontSize) {
  // Client-only app, canvas is always available. Keep one fallback
  // in case getContext ever returns null.
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureCtx = measureCanvas.getContext('2d');
  }
  if (!measureCtx) {
    return {
      width: Math.max(20, (text || '').length * (fontSize * 0.6)),
      height: fontSize * 1.25,
    };
  }
  measureCtx.font = `600 ${fontSize}px 'Inter', system-ui, -apple-system, sans-serif`;
  const lines = (text || '').split('\n');
  let maxWidth = 0;
  for (const l of lines) {
    const w = measureCtx.measureText(l).width;
    if (w > maxWidth) maxWidth = w;
  }
  return {
    width: Math.max(20, Math.ceil(maxWidth)),
    height: Math.max(fontSize * 1.25, Math.ceil(lines.length * (fontSize * 1.25))),
  };
}

export function getAnnotationBounds(annotation, scale = 1) {
  const { type, startX, startY, endX, endY, points = [], text = '', fontSize = 18 } = annotation;

  if (type === TOOL_TYPES.PEN && points.length > 0) {
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    return {
      x: minX * scale,
      y: minY * scale,
      w: Math.max(10, (maxX - minX) * scale),
      h: Math.max(10, (maxY - minY) * scale),
    };
  }

  if (type === TOOL_TYPES.TEXT) {
    const metrics = getTextMetrics(text, fontSize);
    return {
      x: startX * scale,
      y: startY * scale,
      w: metrics.width * scale,
      h: metrics.height * scale,
    };
  }

  const minX = Math.min(startX, endX) * scale;
  const minY = Math.min(startY, endY) * scale;
  const w = Math.abs(endX - startX) * scale;
  const h = Math.abs(endY - startY) * scale;

  return {
    x: minX,
    y: minY,
    w: Math.max(8 * scale, w),
    h: Math.max(8 * scale, h),
  };
}

export function isPointInAnnotation(px, py, annotation) {
  const { type, startX, startY, endX, endY, strokeWidth = 4 } = annotation;

  if (type === TOOL_TYPES.ARROW || type === TOOL_TYPES.LINE) {
    const dist = distToSegment(px, py, startX, startY, endX, endY);
    return dist <= Math.max(14, strokeWidth * 2.5);
  }

  if (type === TOOL_TYPES.RECTANGLE || type === TOOL_TYPES.REDACT) {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    const pad = Math.max(10, strokeWidth);
    return (
      px >= minX - pad &&
      px <= maxX + pad &&
      py >= minY - pad &&
      py <= maxY + pad
    );
  }

  if (type === TOOL_TYPES.CIRCLE) {
    const cx = (startX + endX) / 2;
    const cy = (startY + endY) / 2;
    const rx = Math.abs(endX - startX) / 2;
    const ry = Math.abs(endY - startY) / 2;
    const pad = Math.max(10, strokeWidth);
    const norm = ((px - cx) / Math.max(1, rx + pad)) ** 2 + ((py - cy) / Math.max(1, ry + pad)) ** 2;
    return norm <= 1.25;
  }

  if (type === TOOL_TYPES.TEXT) {
    const bounds = getAnnotationBounds(annotation, 1);
    const pad = 10;
    return (
      px >= bounds.x - pad &&
      px <= bounds.x + bounds.w + pad &&
      py >= bounds.y - pad &&
      py <= bounds.y + bounds.h + pad
    );
  }

  if (type === TOOL_TYPES.PEN && annotation.points) {
    for (let i = 0; i < annotation.points.length - 1; i++) {
      const p1 = annotation.points[i];
      const p2 = annotation.points[i + 1];
      if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) <= Math.max(12, strokeWidth * 2)) {
        return true;
      }
    }
    return false;
  }

  return false;
}

export async function exportAnnotatedImage({ imageElement, annotations, format = 'png', saturation = 100, quality = 0.95, baseWidth }) {
  const canvas = document.createElement('canvas');
  const nativeWidth = imageElement.naturalWidth || imageElement.width;
  const nativeHeight = imageElement.naturalHeight || imageElement.height;

  canvas.width = nativeWidth;
  canvas.height = nativeHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (format === 'jpeg' || format === 'jpg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, nativeWidth, nativeHeight);
  }

  ctx.save();
  if (saturation !== undefined && saturation !== 100) {
    ctx.filter = `saturate(${saturation}%)`;
  }
  ctx.drawImage(imageElement, 0, 0, nativeWidth, nativeHeight);
  ctx.restore();
  ctx.filter = 'none';

  const displayWidth = baseWidth || nativeWidth;
  const scale = displayWidth > 0 ? nativeWidth / displayWidth : 1;

  for (const ann of annotations) {
    drawAnnotation(ctx, ann, scale, false);
  }

  const mimeType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

export async function cropImage({ imageElement, cropBox, annotations = [] }) {
  const canvas = document.createElement('canvas');
  const cropW = Math.max(10, Math.round(cropBox.width));
  const cropH = Math.max(10, Math.round(cropBox.height));
  const cropX = Math.round(cropBox.x);
  const cropY = Math.round(cropBox.y);

  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for crop');

  ctx.drawImage(
    imageElement,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );

  const croppedDataUrl = canvas.toDataURL('image/png');

  const adjustedAnnotations = annotations
    .map((ann) => {
      const copy = clone(ann);
      if (copy.points) {
        copy.points = copy.points.map((p) => ({
          x: p.x - cropX,
          y: p.y - cropY,
        }));
      }
      if (copy.startX !== undefined) copy.startX -= cropX;
      if (copy.startY !== undefined) copy.startY -= cropY;
      if (copy.endX !== undefined) copy.endX -= cropX;
      if (copy.endY !== undefined) copy.endY -= cropY;
      return copy;
    })
    .filter((ann) => {
      const bounds = getAnnotationBounds(ann, 1);
      if (!bounds) return true;
      return (
        bounds.x + bounds.w >= 0 &&
        bounds.x <= cropW &&
        bounds.y + bounds.h >= 0 &&
        bounds.y <= cropH
      );
    });

  return {
    src: croppedDataUrl,
    width: cropW,
    height: cropH,
    annotations: adjustedAnnotations,
  };
}
