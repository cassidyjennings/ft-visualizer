"use client";

import { useEffect, useRef, useState } from "react";
import CanvasGrid, { CanvasGridHandle } from "@/components/CanvasGrid";
import type { BrushMode, BrushShape, BrushSettings } from "@/lib/image/brush";

export default function DrawPage() {
  const [size, setSize] = useState(64);
  // const [value, setValue] = useState(255);
  const [value, setValue] = useState(255);
  const [radius, setRadius] = useState(0);
  const [mode, setMode] = useState<BrushMode>("draw");
  const [shape, setShape] = useState<BrushShape>("circle");
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

      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2">
          Size
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="border p-1"
          >
            {[32, 64, 128, 256].map((s) => (
              <option key={s} value={s}>
                {s} × {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          Grayscale
          <input
            type="range"
            min={0}
            max={255}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <span>{value}</span>
        </label>

        <label className="flex items-center gap-2">
          Radius
          <input
            type="range"
            min={0}
            max={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
          <span>{radius}</span>
        </label>

        <label className="flex items-center gap-2">
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as BrushMode)}
            className="border p-1"
          >
            <option value="draw">Draw</option>
            <option value="erase">Erase</option>
          </select>
        </label>

        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as BrushShape)}
          className="border p-1"
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="diamond">Diamond</option>
          <option value="cross">Cross</option>
          <option value="hline">Horizontal line</option>
          <option value="vline">Vertical line</option>
        </select>

        <button
          className="border px-3 py-1 rounded"
          onClick={() => canvasRef.current?.undo()}
        >
          Undo
        </button>

        <button
          className="border px-3 py-1 rounded"
          onClick={() => canvasRef.current?.clear()}
        >
          Clear
        </button>
      </div>

      <CanvasGrid
        ref={canvasRef}
        width={size}
        height={size}
        brush={brush}
        pixelSize={8}
      />
    </main>
  );
}
