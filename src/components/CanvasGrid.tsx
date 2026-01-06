"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ImageModel, createEmptyImage } from "@/lib/image/model";
import { BrushSettings, strokeLine } from "@/lib/image/brush";

export interface CanvasGridHandle {
  undo: () => void;
  clear: () => void;
  getImage: () => ImageModel;
  getImageData: () => Uint8Array;
}

interface CanvasGridProps {
  selectedSize: number;
  brush: BrushSettings;
  displaySize: number;
  maxUndo?: number;
  showGrid?: boolean;
}

export default forwardRef<CanvasGridHandle, CanvasGridProps>(function CanvasGrid(
  { selectedSize, brush, displaySize, maxUndo = 50, showGrid = true },
  ref,
) {
  // Pixel size computed from display size
  const pixelSize = useMemo(() => {
    return Math.max(1, Math.floor(displaySize / selectedSize));
  }, [displaySize, selectedSize]);

  // snapped bitmap dimensions (<= displaySize)
  const canvasW = selectedSize * pixelSize;
  const canvasH = selectedSize * pixelSize;

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<ImageModel>(createEmptyImage(selectedSize, 0));

  // Undo history stores snapshots of image.data
  const historyRef = useRef<Uint8Array[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Stroke state
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const strokeStartRef = useRef<{ x: number; y: number } | null>(null);
  const strokeBaseSnapshotRef = useRef<Uint8Array | null>(null);

  ///// UNDO + CLEAR HELPERS /////
  function pushHistorySnapshot(snapshot: Uint8Array) {
    // Drop redo states if any
    const idx = historyIndexRef.current;
    const hist = historyRef.current;

    hist.splice(idx + 1);
    hist.push(snapshot);
    if (hist.length > maxUndo) hist.shift();

    historyIndexRef.current = hist.length - 1;
  }

  function initHistory() {
    historyRef.current = [];
    historyIndexRef.current = -1;
    pushHistorySnapshot(imageRef.current.data.slice());
  }

  function restoreFromHistory(index: number) {
    const hist = historyRef.current;
    if (index < 0 || index >= hist.length) return;
    historyIndexRef.current = index;
    imageRef.current.data.set(hist[index]);
    redrawBase();
    redrawOverlay();
  }

  function undo() {
    const nextIndex = historyIndexRef.current - 1;
    restoreFromHistory(nextIndex);
  }

  function clear() {
    imageRef.current = createEmptyImage(selectedSize, 0);
    initHistory();
    redrawBase();
    redrawOverlay();
  }

  ///// REDRAW (RESET CANVAS CONTENT) HELPERS /////
  function redrawBase() {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { data } = imageRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < selectedSize; y++) {
      for (let x = 0; x < selectedSize; x++) {
        const v = data[y * selectedSize + x];
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    if (showGrid) {
      ctx.save();

      // Thin grid lines (visible on dark background)
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;

      // Draw thin grid (use 0.5 offset for crisp 1px lines)
      for (let x = 0; x <= selectedSize; x++) {
        const px = x * pixelSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, selectedSize * pixelSize);
        ctx.stroke();
      }

      for (let y = 0; y <= selectedSize; y++) {
        const py = y * pixelSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(selectedSize * pixelSize, py);
        ctx.stroke();
      }

      // Bold center lines
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;

      const cx = (selectedSize / 2) * pixelSize + 0.5;
      const cy = (selectedSize / 2) * pixelSize + 0.5;

      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, selectedSize * pixelSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(selectedSize * pixelSize, cy);
      ctx.stroke();

      ctx.restore();
    }
  }

  function redrawOverlay() {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!hoverPos) return;

    const { x, y } = hoverPos;
    if (x < 0 || y < 0 || x >= selectedSize || y >= selectedSize) return;

    // Preview outline
    const r = Math.max(0, Math.floor(brush.radius));
    const cx = (x + 0.5) * pixelSize;
    const cy = (y + 0.5) * pixelSize;

    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 1;

    // Draw an approximate outline for different shapes
    switch (brush.shape) {
      case "circle": {
        ctx.beginPath();
        ctx.arc(cx, cy, (r + 0.5) * pixelSize, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "diamond": {
        const d = (r + 0.5) * pixelSize;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx + d, cy);
        ctx.lineTo(cx, cy + d);
        ctx.lineTo(cx - d, cy);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case "hline": {
        const d = (r + 0.5) * pixelSize;
        ctx.beginPath();
        ctx.moveTo(cx - d, cy);
        ctx.lineTo(cx + d, cy);
        ctx.stroke();
        break;
      }
      case "vline": {
        const d = (r + 0.5) * pixelSize;
        ctx.beginPath();
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx, cy + d);
        ctx.stroke();
        break;
      }
      case "cross": {
        const d = (r + 0.5) * pixelSize;
        ctx.beginPath();
        ctx.moveTo(cx - d, cy);
        ctx.lineTo(cx + d, cy);
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx, cy + d);
        ctx.stroke();
        break;
      }
      case "square":
      default: {
        const s = (2 * r + 1) * pixelSize;
        ctx.strokeRect((x - r) * pixelSize, (y - r) * pixelSize, s, s);
        break;
      }
    }
  }

  ///// DRAWING HELPERS /////
  function eventToPixel(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();

    // Position within the overlay canvas element (already offset in CSS)
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const x = Math.floor(xPx / pixelSize);
    const y = Math.floor(yPx / pixelSize);
    return { x, y };
  }

  function beginStroke(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const p = eventToPixel(e);

    lastPosRef.current = p;
    strokeStartRef.current = p;

    // Snapshot image at start of stroke (needed for Shift-straight-lines)
    strokeBaseSnapshotRef.current = imageRef.current.data.slice();

    // Apply initial stamp/segment
    strokeLine(imageRef.current, p.x, p.y, p.x, p.y, brush);
    redrawBase();
  }

  function continueStroke(e: React.MouseEvent<HTMLCanvasElement>) {
    const p = eventToPixel(e);
    setHoverPos(p);

    if (!isDrawing) {
      redrawOverlay();
      return;
    }

    const start = strokeStartRef.current;
    const last = lastPosRef.current;

    if (!start || !last) return;

    if (e.shiftKey) {
      // Straight line mode: restore to stroke base, then draw start -> current
      const base = strokeBaseSnapshotRef.current;
      if (base) imageRef.current.data.set(base);

      strokeLine(imageRef.current, start.x, start.y, p.x, p.y, brush);
      // don't update lastPos in shift mode; keep anchor at start
    } else {
      // Freehand: incremental last -> current
      strokeLine(imageRef.current, last.x, last.y, p.x, p.y, brush);
      lastPosRef.current = p;
    }

    redrawBase();
    redrawOverlay();
  }

  function endStroke() {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Commit snapshot to history
    pushHistorySnapshot(imageRef.current.data.slice());

    lastPosRef.current = null;
    strokeStartRef.current = null;
    strokeBaseSnapshotRef.current = null;

    redrawOverlay();
  }

  useImperativeHandle(ref, () => ({
    undo,
    clear,
    getImage: () => imageRef.current,
    getImageData: () => imageRef.current.data.slice(),
  }));

  // Reset image & history when size changes
  useEffect(() => {
    imageRef.current = createEmptyImage(selectedSize, 0);
    initHistory();
    redrawBase();
    redrawOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize, pixelSize]);

  return (
    <div
      className="relative inline-block bg-black overflow-hidden border"
      style={{
        width: canvasW,
        height: canvasH,
      }}
    >
      <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs">
        {selectedSize}×{selectedSize} • pixelSize={pixelSize}px
      </div>

      <canvas
        ref={baseCanvasRef}
        width={canvasW}
        height={canvasH}
        className="absolute block select-none"
        style={{ imageRendering: "pixelated" }}
      />

      <canvas
        ref={overlayCanvasRef}
        width={canvasW}
        height={canvasH}
        className="absolute left-0 top-0 cursor-crosshair select-none"
        style={{ imageRendering: "pixelated" }}
        onMouseDown={(e) => {
          setHoverPos(eventToPixel(e));
          beginStroke(e);
          redrawOverlay();
        }}
        onMouseMove={(e) => continueStroke(e)}
        onMouseUp={() => endStroke()}
        onMouseLeave={() => {
          endStroke();
          setHoverPos(null);
          redrawOverlay();
        }}
      />
    </div>
  );
});
