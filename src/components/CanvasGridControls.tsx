"use client";

import React from "react";
import type { BrushMode, BrushShape, BrushSettings } from "@/lib/image/brush";
import type { CanvasGridHandle } from "@/components/CanvasGrid";

type Props = {
  gridRef: React.RefObject<CanvasGridHandle | null>;

  size: number;
  setSize: (n: number) => void;

  brush: BrushSettings;
  setBrush: React.Dispatch<React.SetStateAction<BrushSettings>>;

  showGrid: boolean;
  setShowGrid: (v: boolean) => void;

  allowedSizes?: number[];
};

export default function CanvasGridControls({
  gridRef,
  size,
  setSize,
  brush,
  setBrush,
  showGrid,
  setShowGrid,
  allowedSizes = [2, 4, 8, 16, 32, 64, 128, 256],
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
      {/* Size + Undo/Clear */}
      <div className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Size</span>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="border rounded p-2"
          >
            {allowedSizes.map((s) => (
              <option key={s} value={s}>
                {s} × {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-2"
            onClick={() => gridRef.current?.undo()}
          >
            Undo
          </button>
          <button
            className="border rounded px-3 py-2"
            onClick={() => gridRef.current?.clear()}
          >
            Clear
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Show grid
        </label>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <label className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Grayscale</span>
            <span className="text-sm tabular-nums">{brush.value}</span>
          </div>
          <input
            type="range"
            min={0}
            max={255}
            value={brush.value}
            onChange={(e) => setBrush((b) => ({ ...b, value: Number(e.target.value) }))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Radius</span>
            <span className="text-sm tabular-nums">{brush.radius}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={brush.radius}
            onChange={(e) => setBrush((b) => ({ ...b, radius: Number(e.target.value) }))}
          />
        </label>
      </div>

      {/* Mode + Shape */}
      <div className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Mode</span>
          <select
            value={brush.mode}
            onChange={(e) =>
              setBrush((b) => ({ ...b, mode: e.target.value as BrushMode }))
            }
            className="border rounded p-2"
          >
            <option value="draw">Draw</option>
            <option value="erase">Erase</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Shape</span>
          <select
            value={brush.shape}
            onChange={(e) =>
              setBrush((b) => ({ ...b, shape: e.target.value as BrushShape }))
            }
            className="border rounded p-2"
          >
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="diamond">Diamond</option>
            <option value="cross">Cross</option>
            <option value="hline">Horizontal line</option>
            <option value="vline">Vertical line</option>
          </select>
        </label>
      </div>
    </div>
  );
}
