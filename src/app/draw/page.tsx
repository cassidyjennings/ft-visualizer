"use client";

import { useEffect, useRef, useState } from "react";
import CanvasGrid, { CanvasGridHandle } from "@/components/CanvasGrid";
import type { BrushMode, BrushShape, BrushSettings } from "@/lib/image/brush";

export default function DrawPage() {
  const [size, setSize] = useState(64);
  const [value, setValue] = useState(255);
  const [radius, setRadius] = useState(0);
  const [mode, setMode] = useState<BrushMode>("draw");
  const [shape, setShape] = useState<BrushShape>("square");
  const canvasRef = useRef<CanvasGridHandle | null>(null);

  const brush: BrushSettings = {
    value,
    radius,
    mode,
    shape,
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndo) return;

      e.preventDefault();
      canvasRef.current?.undo();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Draw</h1>

      <CanvasGrid
        ref={canvasRef}
        width={size}
        height={size}
        brush={brush}
        maxUndo={50}
        showGrid
        initialDisplaySize={512}
        minDisplaySize={32}
      />

      {/* Controls UNDER canvas, left-half only */}
      <div className="mt-6 w-full md:w-1/2 max-w-130">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
          {/* Left column: Size + Undo/Clear */}
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Size</span>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="border rounded p-2"
              >
                {[2, 4, 8, 16, 32, 64, 128, 256].map((s) => (
                  <option key={s} value={s}>
                    {s} × {s}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button
                className="border rounded px-3 py-2"
                onClick={() => canvasRef.current?.undo()}
              >
                Undo
              </button>
              <button
                className="border rounded px-3 py-2"
                onClick={() => canvasRef.current?.clear()}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Middle column: sliders stacked */}
          <div className="space-y-4">
            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Grayscale</span>
                <span className="text-sm tabular-nums">{value}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Radius</span>
                <span className="text-sm tabular-nums">{radius}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </label>
          </div>

          {/* Right column: mode + shape */}
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as BrushMode)}
                className="border rounded p-2"
              >
                <option value="draw">Draw</option>
                <option value="erase">Erase</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Shape</span>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as BrushShape)}
                className="border rounded p-2"
              >
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="diamond">Diamond</option>
                <option value="cross">Cross</option>
                <option value="hline">Horizontal line</option>
                <option value="vline">Vertical line</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
