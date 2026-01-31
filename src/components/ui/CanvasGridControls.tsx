"use client";

import React, { forwardRef, useEffect, useMemo, useState } from "react";

import type { BrushSettings } from "@/lib/image/brush";
import type { CanvasGridHandle } from "@/components/canvases/CanvasGrid";

import { ToggleGroup, ToggleItem } from "@/components/ui/ToggleGroup";
import {
  DrawIcon,
  EraseIcon,
  CircleIcon,
  SquareIcon,
  DiamondIcon,
  CrossIcon,
  HLineIcon,
  VLineIcon,
} from "@/components/icons/brushIcons";
import { EyeClosedIcon, EyeOpenIcon } from "@/components/icons/showHideIcons";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function format01(v255: number) {
  const v = v255 / 255;
  if (v === 0 || v === 1) return String(v);
  return v.toFixed(3);
}

type Props = {
  isDark: boolean;

  gridRef: React.RefObject<CanvasGridHandle | null>;
  handleClear: () => void;
  displaySize: number;
  outerSize: number;

  allowedSizes?: number[];
  size: number;
  setSize: (n: number) => void;

  brush: BrushSettings;
  onBrushChange: (brush: BrushSettings) => void;

  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
};

function btnBase(active?: boolean) {
  return [
    "inline-flex items-center justify-center",
    "border rounded",
    "hover:bg-fg/10 active:scale-95 transition",
    "select-none",
    active ? "bg-fg/15 border-border" : "bg-card border-border/80",
  ].join(" ");
}

type CSSVars = React.CSSProperties & {
  ["--ui-font"]?: string;
  ["--control-h"]?: string;
  ["--icon"]?: string;
  ["--btn-px"]?: string;
  ["--toggle-px"]?: string;
  ["--slider-max-w"]?: string;
  ["--shape-w"]?: string;
  "--thumb"?: string;
  "--track"?: string;
};

export default forwardRef<HTMLDivElement, Props>(function CanvasGridControls(
  {
    isDark,
    gridRef,
    handleClear,
    displaySize,
    outerSize,
    allowedSizes = [2, 4, 8, 16, 32, 64],
    size,
    setSize,
    brush,
    onBrushChange,
    showGrid,
    setShowGrid,
  },
  ref,
) {
  const isErase = brush.mode === "erase";
  const reverseForLight = !isDark;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ui = useMemo(() => {
    // Scale derived from canvas display size
    const scale = clamp(displaySize / 560, 0.7, 0.95);
    // UI sizes derived from scale
    const controlH = Math.round(clamp(34 * scale, 26, 36));
    const iconPx = Math.round(controlH * 0.6);
    const btnPx = Math.round(clamp(11 * scale, 8, 11));
    const togglePadPx = Math.round(clamp(9 * scale, 7, 10));
    const fontPx = Math.round(clamp(15 * scale, 12, 15));

    const sliderMaxW = Math.round(clamp(440 * scale, 200, 440));
    const shapeW = Math.round(clamp(420 * scale, 220, 420));

    return { scale, controlH, iconPx, btnPx, togglePadPx, fontPx, sliderMaxW, shapeW };
  }, [displaySize]);

  const sliderStyle: CSSVars = isErase
    ? { "--track": "#444", "--thumb": "#666" }
    : {
        // Dark: black -> white (0 on left, 255 on right)
        // Light: white -> black (255 on left, 0 on right)
        "--track": reverseForLight
          ? "linear-gradient(to right, rgb(255,255,255), rgb(0,0,0))"
          : "linear-gradient(to right, rgb(0,0,0), rgb(255,255,255))",
        "--thumb": `rgb(${brush.value}, ${brush.value}, ${brush.value})`,
      };

  const rootStyle: CSSVars = {
    maxWidth: outerSize,
    fontSize: `${ui.fontPx}px`,
    "--ui-font": `${ui.fontPx}px`,
    "--control-h": `${ui.controlH}px`,
    "--icon": `${ui.iconPx}px`,
    "--btn-px": `${ui.btnPx}px`,
    "--toggle-px": `${ui.togglePadPx}px`,
    "--slider-max-w": `${ui.sliderMaxW}px`,
    "--shape-w": `${ui.shapeW}px`,
  };

  const labelCls = "font-medium";
  const selectCls = "border border-border rounded bg-card px-2";
  const rangeCls = "w-full h-2 rounded-lg appearance-none bg-transparent min-w-0";

  return (
    <div ref={ref} className="mt-3 w-full min-w-0" style={rootStyle}>
      <div
        className={[
          "min-w-0 shadow",
          "rounded-xl border border-border",
          "bg-card/80", // subtle panel tint
          "p-2 sm:p-3",
        ].join(" ")}
      >
        {/* 3 columns on md+, stacked on mobile */}
        <div
          className={[
            "grid min-w-0",
            "grid-cols-1 gap-2",
            "md:grid-cols-[0.65fr_1.5fr_0.6fr]",
            "md:gap-0 md:divide-x md:divide-border",
          ].join(" ")}
        >
          {/* ================= LEFT: GRID ================= */}
          <section className="min-w-0 grid gap-2 md:px-2">
            {/* Size (row 1) */}
            <div className="min-w-0 grid gap-2 ">
              <span className="font-semibold">Grid</span>

              <div className="grid gap-1">
                <span className="text-fg/70 text-xs font-medium">Grid Size</span>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className={`${selectCls} w-full`}
                  style={{ height: ui.controlH }}
                >
                  {allowedSizes.map((s) => (
                    <option key={s} value={s}>
                      {s} × {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid lines (row 2) */}
            <div className="min-w-0 grid gap-1">
              <span className="text-fg/70 text-xs font-medium">Grid Lines</span>
              <ToggleGroup height={ui.controlH} className="w-full min-w-0">
                <ToggleItem
                  grow
                  active={showGrid}
                  padX={ui.togglePadPx}
                  onClick={() => setShowGrid(true)}
                  title="Show grid"
                  isFirst
                >
                  <EyeOpenIcon size={ui.iconPx} />
                </ToggleItem>
                <ToggleItem
                  grow
                  active={!showGrid}
                  padX={ui.togglePadPx}
                  onClick={() => setShowGrid(false)}
                  title="Hide grid"
                >
                  <EyeClosedIcon size={ui.iconPx} />
                </ToggleItem>
              </ToggleGroup>
            </div>
          </section>

          {/* ================= MIDDLE: BRUSH ================= */}
          <section className="min-w-0 grid gap-2 md:px-2">
            <div className="min-w-0 grid gap-2">
              <span className="font-semibold leading-none">Brush</span>

              {/* Top row: Value + Radius side-by-side */}
              <div className="grid grid-cols-2 gap-3 min-w-0">
                {/* Brush Value */}
                <div className="min-w-0 grid gap-2">
                  <div
                    className={[
                      "flex items-center justify-between",
                      isErase ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    <span className="text-xs font-medium text-fg/70 leading-none">
                      Value
                    </span>
                    <span className="tabular-nums text-xs">
                      {mounted ? format01(brush.value) : "0"}
                    </span>
                  </div>

                  <div
                    className="border border-border rounded bg-card px-2 flex items-center min-w-0"
                    style={{ height: ui.controlH }}
                  >
                    <input
                      type="range"
                      min={0}
                      max={255}
                      dir={reverseForLight ? "rtl" : "ltr"}
                      disabled={isErase}
                      value={brush.value}
                      onChange={(e) =>
                        onBrushChange({ ...brush, value: Number(e.target.value) })
                      }
                      className={[
                        "gray-slider",
                        rangeCls,
                        isErase ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                      ].join(" ")}
                      style={sliderStyle}
                    />
                  </div>
                </div>

                {/* Brush Radius */}
                <div className="min-w-0 grid gap-1.5">
                  <div className="flex items-center justify-between min-w-0">
                    <span className="text-xs font-medium text-fg/70 leading-none">
                      Radius
                    </span>
                    <span className="tabular-nums text-xs">{brush.radius}</span>
                  </div>

                  <div
                    className="border border-border rounded bg-card px-2 flex items-center min-w-0"
                    style={{ height: ui.controlH }}
                  >
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={brush.radius}
                      onChange={(e) =>
                        onBrushChange({ ...brush, radius: Number(e.target.value) })
                      }
                      className="w-full min-w-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row: Brush Shape */}
            <div className="min-w-0 grid gap-2">
              <span className="text-xs font-medium text-fg/70 leading-none">Shape</span>

              <ToggleGroup
                height={ui.controlH}
                className="w-full min-w-0 grid grid-cols-3 sm:grid-cols-6"
              >
                <ToggleItem
                  grow
                  active={brush.shape === "circle"}
                  padX={ui.togglePadPx}
                  onClick={() => onBrushChange({ ...brush, shape: "circle" })}
                  title="Circle"
                  isFirst
                >
                  <CircleIcon size={ui.iconPx} />
                </ToggleItem>

                <ToggleItem
                  grow
                  active={brush.shape === "square"}
                  padX={ui.togglePadPx}
                  onClick={() => onBrushChange({ ...brush, shape: "square" })}
                  title="Square"
                >
                  <SquareIcon size={ui.iconPx} />
                </ToggleItem>

                <ToggleItem
                  grow
                  active={brush.shape === "diamond"}
                  padX={ui.togglePadPx}
                  onClick={() => onBrushChange({ ...brush, shape: "diamond" })}
                  title="Diamond"
                >
                  <DiamondIcon size={ui.iconPx} />
                </ToggleItem>

                <ToggleItem
                  grow
                  active={brush.shape === "cross"}
                  padX={ui.togglePadPx}
                  onClick={() => onBrushChange({ ...brush, shape: "cross" })}
                  title="Cross"
                >
                  <CrossIcon size={ui.iconPx} />
                </ToggleItem>

                <ToggleItem
                  grow
                  active={brush.shape === "hline"}
                  padX={ui.togglePadPx}
                  onClick={() => onBrushChange({ ...brush, shape: "hline" })}
                  title="Horizontal line"
                >
                  <HLineIcon size={ui.iconPx} />
                </ToggleItem>

                <ToggleItem
                  grow
                  active={brush.shape === "vline"}
                  padX={ui.togglePadPx}
                  onClick={() => onBrushChange({ ...brush, shape: "vline" })}
                  title="Vertical line"
                >
                  <VLineIcon size={ui.iconPx} />
                </ToggleItem>
              </ToggleGroup>
            </div>
          </section>

          {/* ================= RIGHT: ACTIONS ================= */}
          <section className="min-w-0 grid gap-2 md:px-2">
            {/* Header */}
            <div className="min-w-0 grid gap-2">
              <span className={labelCls}>Actions</span>

              {/* Top row: Draw vs Erase */}
              <div className="min-w-0 grid">
                <ToggleGroup height={ui.controlH} className="w-full min-w-0">
                  <ToggleItem
                    grow
                    active={brush.mode === "draw"}
                    padX={ui.togglePadPx}
                    onClick={() => onBrushChange({ ...brush, mode: "draw" })}
                    title="Draw"
                    isFirst
                  >
                    <DrawIcon size={ui.iconPx} />
                  </ToggleItem>
                  <ToggleItem
                    grow
                    active={brush.mode === "erase"}
                    padX={ui.togglePadPx}
                    onClick={() => onBrushChange({ ...brush, mode: "erase" })}
                    title="Erase"
                  >
                    <EraseIcon size={ui.iconPx} />
                  </ToggleItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Bottom row: Undo / Clear */}
            <div className="min-w-0 grid gap-2">
              <button
                type="button"
                className={btnBase(false)}
                style={{ height: ui.controlH, paddingInline: ui.btnPx }}
                onClick={() => gridRef.current?.undo()}
              >
                Undo
              </button>
              <button
                type="button"
                className={btnBase(false)}
                style={{ height: ui.controlH, paddingInline: ui.btnPx }}
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});
