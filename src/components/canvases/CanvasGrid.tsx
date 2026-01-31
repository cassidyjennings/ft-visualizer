"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import RegalCanvasFrame from "@/components/ui/RegalCanvasFrame";

import { ImageModel, createEmptyImage } from "@/lib/image/model";
import { BrushSettings, strokeLine } from "@/lib/image/brush";
import { useSettings } from "@/lib/settings/SettingsContext";
import type { Settings } from "@/lib/settings/types";
import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";
import { cssVarToRgba } from "@/lib/ui/utils";

/**
 * Origin / centering modes expected in settings.
 * If your project uses different strings, update OriginMode + the lookup below.
 */
type OriginMode = "centerBetween" | "topLeft" | "centerPixel";

export interface CanvasGridHandle {
  undo: () => void;
  clear: () => void;
  getImage: () => ImageModel;
  getImageData: () => Uint8Array;
  invertColors: () => void;
  getOuterSize: () => number; // canvas + frame size in px
}

interface CanvasGridProps {
  selectedSize: number;
  brush: BrushSettings;
  displaySize: number;
  maxUndo?: number;
  showGrid?: boolean;

  showFrame?: boolean;
  frameThickness?: number; // maps to RegalCanvasFrame frame
  framePad?: number; // maps to RegalCanvasFrame pad
  frameVariant?: "navy" | "tan";
}

export default forwardRef<CanvasGridHandle, CanvasGridProps>(function CanvasGrid(
  {
    selectedSize,
    brush,
    displaySize,
    maxUndo = 50,
    showGrid = true,

    showFrame = true,
    frameThickness = 14,
    framePad = 2,
  },
  ref,
) {
  const { settings } = useSettings();

  // Display coloring
  const effectiveTheme = useEffectiveColoring(settings.coloring); // "light" | "dark"
  const isDark = effectiveTheme === "dark";
  const bg = isDark ? 0 : 255;

  // Expected values: "betweenMiddle" | "topLeftPixel" | "centerPixel"
  const originMode = (settings as Settings)?.center as OriginMode | undefined;

  // Pixel size computed from display size
  const pixelSize = useMemo(() => {
    return Math.max(1, Math.floor(displaySize / selectedSize));
  }, [displaySize, selectedSize]);

  // snapped bitmap dimensions (<= displaySize)
  const canvasSize = selectedSize * pixelSize;

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<ImageModel>(createEmptyImage(selectedSize, bg));

  // Frame sizing
  const inset = framePad + frameThickness;
  const outerPx = showFrame ? canvasSize + 2 * inset : canvasSize;

  // Undo history stores snapshots of image.data
  const historyRef = useRef<Uint8Array[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Stroke state
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const strokeStartRef = useRef<{ x: number; y: number } | null>(null);
  const strokeBaseSnapshotRef = useRef<Uint8Array | null>(null);

  // ===== UNDO + CLEAR HELPERS =====
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
    imageRef.current = createEmptyImage(selectedSize, bg);
    initHistory();
    redrawBase();
    redrawOverlay();
  }

  // ===== GRID OVERLAY HELPERS (ORIGIN-AWARE) =====
  function drawThinGrid(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = cssVarToRgba("--fg", 0.15);
    ctx.lineWidth = 1;

    // crisp 1px lines
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

    ctx.restore();
  }

  function drawOriginAxes(ctx: CanvasRenderingContext2D) {
    // Defaults to your current behavior if settings are missing:
    const mode: OriginMode = originMode ?? "centerBetween";

    ctx.save();
    ctx.strokeStyle = cssVarToRgba("--fg", 0.15);
    ctx.lineWidth = 2;

    // Helper to stroke a full-height vertical gridline at boundary index bx (0..selectedSize)
    const strokeVBoundary = (bx: number) => {
      if (bx < 0 || bx > selectedSize) return;
      const x = bx * pixelSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, selectedSize * pixelSize);
      ctx.stroke();
    };

    // Helper to stroke a full-width horizontal gridline at boundary index by (0..selectedSize)
    const strokeHBoundary = (by: number) => {
      if (by < 0 || by > selectedSize) return;
      const y = by * pixelSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(selectedSize * pixelSize, y);
      ctx.stroke();
    };

    if (mode === "centerBetween") {
      // Axes at exact middle boundary
      const bx = selectedSize / 2;
      const by = selectedSize / 2;
      strokeVBoundary(bx);
      strokeHBoundary(by);
      ctx.restore();
      return;
    }

    // For pixel-origin modes, "center" is a pixel at (ox, oy).
    // We outline the origin column and origin row by drawing thick boundaries
    // on both sides: ox and ox+1, oy and oy+1.
    let ox = 0;
    let oy = 0;

    if (mode === "topLeft") {
      ox = 0;
      oy = 0;
    } else {
      // mode === "centerPixel" (bottom-right middle pixel)
      ox = Math.floor(selectedSize / 2);
      oy = Math.floor(selectedSize / 2);
    }

    // Outline the origin column (both sides)
    strokeVBoundary(ox);
    strokeVBoundary(ox + 1);

    // Outline the origin row (both sides)
    strokeHBoundary(oy);
    strokeHBoundary(oy + 1);

    ctx.restore();
  }

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
      drawThinGrid(ctx);
      drawOriginAxes(ctx);
    }
  }

  function redrawOverlay(posOverride?: { x: number; y: number } | null) {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Always clear first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pos = posOverride !== undefined ? posOverride : hoverPos;

    // Nothing to draw if cursor is not on canvas
    if (!pos) return;

    const { x, y } = pos;
    if (x < 0 || y < 0 || x >= selectedSize || y >= selectedSize) return;

    const r = Math.max(0, Math.floor(brush.radius));
    const cx = (x + 0.5) * pixelSize;
    const cy = (y + 0.5) * pixelSize;

    ctx.strokeStyle = isDark ? "rgba(255,252,249,0.7)" : "rgba(0,0,0,0.6)";
    ctx.lineWidth = 1;

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
      default: {
        const s = (2 * r + 1) * pixelSize;
        ctx.strokeRect((x - r) * pixelSize, (y - r) * pixelSize, s, s);
      }
    }
  }

  // ===== DRAWING HELPERS =====
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
    strokeLine(imageRef.current, p.x, p.y, p.x, p.y, brush, isDark);
    redrawBase();
  }

  function continueStroke(e: React.MouseEvent<HTMLCanvasElement>) {
    const p = eventToPixel(e);
    setHoverPos(p);

    if (!isDrawing) {
      redrawOverlay(p); // draw using the fresh p, no waiting for state
      return;
    }

    const start = strokeStartRef.current;
    const last = lastPosRef.current;

    if (!start || !last) return;

    if (e.shiftKey) {
      // Straight line mode: restore to stroke base, then draw start -> current
      const base = strokeBaseSnapshotRef.current;
      if (base) imageRef.current.data.set(base);

      strokeLine(imageRef.current, start.x, start.y, p.x, p.y, brush, isDark);
      // don't update lastPos in shift mode; keep anchor at start
    } else {
      // Freehand: incremental last -> current
      strokeLine(imageRef.current, last.x, last.y, p.x, p.y, brush, isDark);
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

  function invertInPlace(arr: Uint8Array) {
    for (let i = 0; i < arr.length; i++) arr[i] = 255 - arr[i];
  }

  useImperativeHandle(ref, () => ({
    undo,
    clear,
    getImage: () => imageRef.current,
    getImageData: () => imageRef.current.data.slice(),

    invertColors() {
      // Invert current pixels
      invertInPlace(imageRef.current.data);

      // Invert undo history snapshots so undo/redo stays consistent
      for (const snap of historyRef.current) invertInPlace(snap);

      redrawBase();
      redrawOverlay(null);
    },
    getOuterSize: () => outerPx,
  }));

  // Redraw after theme / grid settings change.
  // Use rAF so CSS variables have updated before we read them in cssVarToRgba.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      redrawBase();
      redrawOverlay(); // keeps brush preview consistent too
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGrid, originMode, effectiveTheme, pixelSize, selectedSize]);

  // Reset image & history when size changes
  useEffect(() => {
    imageRef.current = createEmptyImage(selectedSize, isDark ? 0 : 255);
    initHistory();
    redrawBase();
    redrawOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize, pixelSize]);

  return (
    <div className="relative inline-block" style={{ width: outerPx, height: outerPx }}>
      {/* Frame behind (does NOT block pixels) */}
      {showFrame && (
        <div className="absolute inset-0 pointer-events-none">
          <RegalCanvasFrame
            innerSize={canvasSize}
            frame={frameThickness}
            pad={framePad}
          />
        </div>
      )}

      {/* Canvases placed inside the frame window */}
      <div
        className="absolute"
        style={{
          left: showFrame ? inset : 0,
          top: showFrame ? inset : 0,
          width: canvasSize,
          height: canvasSize,
        }}
      >
        <canvas
          ref={baseCanvasRef}
          width={canvasSize}
          height={canvasSize}
          className="absolute inset-0 block select-none"
          style={{ imageRendering: "pixelated" }}
        />

        <canvas
          ref={overlayCanvasRef}
          width={canvasSize}
          height={canvasSize}
          className="absolute inset-0 select-none cursor-crosshair"
          style={{ imageRendering: "pixelated" }}
          onMouseDown={(e) => {
            setHoverPos(eventToPixel(e));
            beginStroke(e);
          }}
          onMouseMove={(e) => continueStroke(e)}
          onMouseUp={() => endStroke()}
          onMouseLeave={() => {
            endStroke();
            setHoverPos(null);
            redrawOverlay(null);
          }}
        />
      </div>
    </div>
  );
});
