"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StemPlotCanvasProps = {
  data: number[] | null;
  yMin: number;
  yMax: number;
  xLabel?: string;
  yLabel?: string;
  interactive?: boolean;
  onDrag?: (index: number, value: number) => void;
  yTicks?: number[];
  yTickFormat?: (v: number) => string;
  baselineY?: number;
  stemColor?: string;
  /** Smaller dots and thinner lines for secondary plots */
  compact?: boolean;
};

const MARGIN = { top: 10, right: 18, bottom: 34, left: 52 };

function defaultYTicks(yMin: number, yMax: number, count = 4): number[] {
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(yMin + (i / count) * (yMax - yMin));
  }
  return ticks;
}

function defaultYTickFormat(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2);
}

function xTickStep(N: number): number {
  if (N <= 16) return 1;
  if (N <= 32) return 2;
  if (N <= 48) return 4;
  return 8;
}

export default function StemPlotCanvas({
  data,
  yMin,
  yMax,
  xLabel,
  yLabel,
  interactive = false,
  onDrag,
  yTicks,
  yTickFormat,
  baselineY = 0,
  stemColor,
  compact = false,
}: StemPlotCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 400, h: 260 });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // Bumped whenever the `<html>` class changes (e.g. theme toggle). This is
  // required because the theme class is toggled in a parent effect that runs
  // AFTER this component's draw effect on the same render, so we cannot rely
  // on React prop changes alone — we must observe the DOM directly.
  const [themeVersion, setThemeVersion] = useState(0);

  // Measure container — fills both width and height of its parent
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Observe `<html>` class changes so we redraw AFTER the theme class flips
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const obs = new MutationObserver(() => {
      setThemeVersion((v) => v + 1);
    });
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Coordinate helpers (display pixels, not canvas pixels)
  const plotX = MARGIN.left;
  const plotY = MARGIN.top;
  const plotW = size.w - MARGIN.left - MARGIN.right;
  const plotH = size.h - MARGIN.top - MARGIN.bottom;
  const N = data ? data.length : 0;

  const xPos = useCallback(
    (i: number) => {
      if (N <= 1) return plotX + plotW / 2;
      return plotX + (i / (N - 1)) * plotW;
    },
    [N, plotX, plotW],
  );

  const yPos = useCallback(
    (v: number) => plotY + (1 - (v - yMin) / (yMax - yMin)) * plotH,
    [plotY, plotH, yMin, yMax],
  );

  const yInverse = useCallback(
    (py: number) => yMin + (1 - (py - plotY) / plotH) * (yMax - yMin),
    [plotY, plotH, yMin, yMax],
  );

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(document.documentElement);
    const fg = style.getPropertyValue("--fg").trim();
    const card = style.getPropertyValue("--card").trim();
    const brand2 = style.getPropertyValue("--brand-2").trim();
    const border = style.getPropertyValue("--border").trim();
    const color = stemColor || brand2;

    // Fully clear (transparent) so labels outside the plot sit on the page bg
    ctx.clearRect(0, 0, size.w, size.h);

    // Fill ONLY the plot area with the card color
    ctx.fillStyle = card;
    ctx.fillRect(plotX, plotY, plotW, plotH);

    // Plot area border
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW, plotH);

    // Baseline
    if (baselineY >= yMin && baselineY <= yMax) {
      const by = yPos(baselineY);
      ctx.beginPath();
      ctx.strokeStyle = fg + "30";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(plotX, by);
      ctx.lineTo(plotX + plotW, by);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Y-axis ticks
    const ticks = yTicks ?? defaultYTicks(yMin, yMax);
    const fmt = yTickFormat ?? defaultYTickFormat;
    ctx.fillStyle = fg;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const t of ticks) {
      const y = yPos(t);
      if (y < plotY - 1 || y > plotY + plotH + 1) continue;
      ctx.fillStyle = fg;
      ctx.fillText(fmt(t), plotX - 7, y);
      ctx.beginPath();
      ctx.strokeStyle = fg + "40";
      ctx.lineWidth = 1;
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX - 4, y);
      ctx.stroke();
    }

    // X-axis ticks
    if (N > 0) {
      const step = xTickStep(N);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let i = 0; i < N; i += step) {
        const x = xPos(i);
        ctx.fillStyle = fg;
        ctx.fillText(String(i), x, plotY + plotH + 6);
        ctx.beginPath();
        ctx.strokeStyle = fg + "40";
        ctx.lineWidth = 1;
        ctx.moveTo(x, plotY + plotH);
        ctx.lineTo(x, plotY + plotH + 4);
        ctx.stroke();
      }
      // Always show last index if not already shown
      if ((N - 1) % step !== 0 && N > 1) {
        const x = xPos(N - 1);
        ctx.fillStyle = fg;
        ctx.fillText(String(N - 1), x, plotY + plotH + 6);
        ctx.beginPath();
        ctx.strokeStyle = fg + "40";
        ctx.lineWidth = 1;
        ctx.moveTo(x, plotY + plotH);
        ctx.lineTo(x, plotY + plotH + 4);
        ctx.stroke();
      }
    }

    // Axis labels
    if (xLabel) {
      ctx.fillStyle = fg;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(xLabel, plotX + plotW / 2, plotY + plotH + 22);
    }
    if (yLabel) {
      ctx.save();
      ctx.fillStyle = fg;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.translate(14, plotY + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // Stems
    if (data && N > 0) {
      const handleR = compact
        ? Math.max(1.5, Math.min(3, plotW / (N * 4)))
        : Math.max(2, Math.min(4.5, plotW / (N * 3)));
      const stemW = compact
        ? Math.max(0.5, Math.min(1, plotW / (N * 6)))
        : Math.max(1, Math.min(1.6, plotW / (N * 4)));
      const by = yPos(baselineY);

      for (let i = 0; i < N; i++) {
        const x = xPos(i);
        const y = yPos(Math.max(yMin, Math.min(yMax, data[i])));

        // Stem line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = stemW;
        ctx.moveTo(x, by);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Handle circle
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, handleR, 0, 2 * Math.PI);
        ctx.fill();
        if (interactive) {
          ctx.strokeStyle = fg;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }, [
    data,
    size,
    yMin,
    yMax,
    xLabel,
    yLabel,
    interactive,
    compact,
    baselineY,
    stemColor,
    yTicks,
    yTickFormat,
    plotX,
    plotY,
    plotW,
    plotH,
    N,
    xPos,
    yPos,
    themeVersion,
  ]);

  // Pointer interaction
  const findHandle = useCallback(
    (px: number, py: number): number | null => {
      if (!data || N === 0) return null;
      const threshold = Math.max(15, plotW / (N * 1.5));
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < N; i++) {
        const hx = xPos(i);
        const hy = yPos(data[i]);
        const dist = Math.hypot(px - hx, py - hy);
        if (dist < threshold && dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx >= 0 ? bestIdx : null;
    },
    [data, N, plotW, xPos, yPos],
  );

  const getCoords = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || !onDrag) return;
      const { x, y } = getCoords(e);
      const idx = findHandle(x, y);
      if (idx !== null) {
        setDragIdx(idx);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const value = Math.max(yMin, Math.min(yMax, yInverse(y)));
        onDrag(idx, value);
      }
    },
    [interactive, onDrag, findHandle, yInverse, yMin, yMax],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !interactive) return;
      const { x, y } = getCoords(e);

      if (dragIdx !== null && onDrag) {
        const value = Math.max(yMin, Math.min(yMax, yInverse(y)));
        onDrag(dragIdx, value);
      } else {
        const idx = findHandle(x, y);
        canvas.style.cursor = idx !== null ? "grab" : "default";
      }
    },
    [interactive, dragIdx, onDrag, findHandle, yInverse, yMin, yMax],
  );

  const handlePointerUp = useCallback(() => {
    setDragIdx(null);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-0">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, display: "block" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
