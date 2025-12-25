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
  width: number;
  height: number;
  brush: BrushSettings;
  maxUndo?: number;
  showGrid?: boolean;
  initialDisplaySize?: number; // px, e.g. 512
  minDisplaySize?: number; // px, e.g. 160
}

export default forwardRef<CanvasGridHandle, CanvasGridProps>(function CanvasGrid(
  {
    width,
    height,
    brush,
    maxUndo = 50,
    showGrid = true,
    initialDisplaySize = 512,
    minDisplaySize,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [displaySize, setDisplaySize] = useState<number>(initialDisplaySize ?? 512);
  const resizingRef = useRef(false);

  // Pixel size computed from display size
  const pixelSize = useMemo(() => {
    // ensure at least 1px per pixel
    return Math.max(1, Math.floor(displaySize / width));
  }, [displaySize, width]);

  const canvasW = useMemo(() => width * pixelSize, [width, pixelSize]);
  const canvasH = useMemo(() => height * pixelSize, [height, pixelSize]);

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<ImageModel>(createEmptyImage(width, height, 0));

  // Undo history stores snapshots of image.data
  const historyRef = useRef<Uint8Array[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Stroke state
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const strokeStartRef = useRef<{ x: number; y: number } | null>(null);
  const strokeBaseSnapshotRef = useRef<Uint8Array | null>(null);

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
    imageRef.current = createEmptyImage(width, height, 0);
    initHistory();
    redrawBase();
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
    imageRef.current = createEmptyImage(width, height, 0);
    initHistory();
    redrawBase();
    redrawOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      if (resizingRef.current) return;
      resizingRef.current = true;

      try {
        const rect = el.getBoundingClientRect();
        const w = Math.floor(rect.width);
        if (!Number.isFinite(w) || w <= 0) return;

        // Set height to equal width
        el.style.height = `${w}px`;

        // Use width as the displaySize
        setDisplaySize(w);
      } finally {
        // next frame to avoid feedback loops
        requestAnimationFrame(() => {
          resizingRef.current = false;
        });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    redrawBase();
    redrawOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelSize, showGrid, brush.radius, brush.shape]);

  function redrawBase() {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { data } = imageRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = data[y * width + x];
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    if (showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, height * pixelSize);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(width * pixelSize, y * pixelSize);
        ctx.stroke();
      }
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
    if (x < 0 || y < 0 || x >= width || y >= height) return;

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

  function eventToPixel(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
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

  return (
    <div
      ref={containerRef}
      className="relative inline-block border"
      style={{
        width: initialDisplaySize ?? 512,
        height: initialDisplaySize ?? 512,
        resize: "horizontal",
        overflow: "hidden",
        minWidth: minDisplaySize ?? 160,
        minHeight: minDisplaySize ?? 160,
      }}
    >
      <div className="absolute right-2 top-2 rounded bg-white/80 px-2 py-1 text-xs">
        {width}×{height} • pixelSize={pixelSize}px
      </div>

      <canvas
        ref={baseCanvasRef}
        width={canvasW}
        height={canvasH}
        className="absolute left-0 top-0 block select-none"
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
