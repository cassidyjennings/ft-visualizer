"use client";

import React, { forwardRef, useMemo } from "react";

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

type Props = {
  gridRef: React.RefObject<CanvasGridHandle | null>;
  displaySize: number;

  size: number;
  setSize: (n: number) => void;

  brush: BrushSettings;
  setBrush: React.Dispatch<React.SetStateAction<BrushSettings>>;

  showGrid: boolean;
  setShowGrid: (v: boolean) => void;

  allowedSizes?: number[];
};

function btnBase(active?: boolean) {
  return [
    "inline-flex items-center justify-center",
    "border rounded",
    "hover:bg-white/10 active:scale-95 transition",
    "select-none",
    active ? "bg-white/15 border-white/40" : "bg-black border-white/20",
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
    gridRef,
    displaySize,
    size,
    setSize,
    brush,
    setBrush,
    showGrid,
    setShowGrid,
    allowedSizes = [2, 4, 8, 16, 32, 64],
  },
  ref,
) {
  const isErase = brush.mode === "erase";

  const ui = useMemo(() => {
    // Scale derived from canvas display size
    const scale = clamp(displaySize / 560, 0.72, 1.0);
    // UI sizes derived from scale
    const controlH = Math.round(clamp(40 * scale, 28, 40));
    const iconPx = Math.round(controlH * 0.6);
    const btnPx = Math.round(clamp(12 * scale, 8, 12));
    const togglePadPx = Math.round(clamp(10 * scale, 8, 12));
    const fontPx = Math.round(clamp(16 * scale, 12, 16));
    const sliderMaxW = Math.round(clamp(440 * scale, 200, 440));
    const shapeW = Math.round(clamp(420 * scale, 220, 420));

    return { scale, controlH, iconPx, btnPx, togglePadPx, fontPx, sliderMaxW, shapeW };
  }, [displaySize]);

  const rootStyle: CSSVars = {
    maxWidth: displaySize,
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
  const selectCls = "border border-white/20 rounded bg-black px-2";

  const sliderStyle: CSSVars = isErase
    ? {
        "--track": "#444",
        "--thumb": "#666",
      }
    : {
        "--track": "linear-gradient(to right, rgb(0,0,0), rgb(255,255,255))",
        "--thumb": `rgb(${brush.value}, ${brush.value}, ${brush.value})`,
      };

  return (
    <div ref={ref} className="mt-3 w-full min-w-0" style={rootStyle}>
      <div
        className={[
          "grid min-w-0 items-stretch",
          "gap-x-4 gap-y-4",
          "grid-cols-1 grid-rows-6",
          "md:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] md:grid-rows-2",
        ].join(" ")}
      >
        {/* ===== Size ===== */}
        <div className="min-w-0 grid items-end justify-items-stretch md:col-start-1 md:row-start-1">
          <div className="grid gap-2 w-full min-w-0">
            <span className={labelCls}>Size</span>
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

        {/* ===== Grid Lines ===== */}
        <div className="min-w-0 grid items-end justify-items-stretch md:col-start-1 md:row-start-2">
          <div className="grid gap-2 w-full min-w-0">
            <span className={labelCls}>Grid Lines</span>
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
        </div>

        {/* ===== Brush Value ===== */}
        <div className="min-w-0 grid items-end justify-items-center md:col-start-2 md:row-start-1">
          <div className="grid gap-2 w-full min-w-0" style={{ maxWidth: ui.sliderMaxW }}>
            <div
              className={[
                "flex items-center justify-between",
                isErase ? "opacity-40" : "",
              ].join(" ")}
            >
              <span className={labelCls}>Brush Value</span>
              <span className="tabular-nums">{brush.value}</span>
            </div>
            <div
              className="border border-white/20 rounded bg-black px-2 flex items-center min-w-0"
              style={{ height: ui.controlH }}
            >
              <input
                type="range"
                min={0}
                max={255}
                value={brush.value}
                disabled={isErase}
                onChange={(e) =>
                  setBrush((b) => ({ ...b, value: Number(e.target.value) }))
                }
                className={[
                  "gray-slider w-full h-2 rounded-lg appearance-none min-w-0",
                  isErase ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                ].join(" ")}
                style={sliderStyle}
              />
            </div>
          </div>
        </div>

        {/* ===== Brush Radius ===== */}
        <div className="min-w-0 grid items-end justify-items-center md:col-start-2 md:row-start-2">
          <div className="grid gap-2 w-full min-w-0" style={{ maxWidth: ui.sliderMaxW }}>
            <div className="flex items-center justify-between min-w-0">
              <span className={labelCls}>Brush Radius</span>
              <span className="tabular-nums">{brush.radius}</span>
            </div>
            <div
              className="border border-white/20 rounded bg-black px-2 flex items-center min-w-0"
              style={{ height: ui.controlH }}
            >
              <input
                type="range"
                min={0}
                max={10}
                value={brush.radius}
                onChange={(e) =>
                  setBrush((b) => ({ ...b, radius: Number(e.target.value) }))
                }
                className="w-full cursor-pointer min-w-0"
              />
            </div>
          </div>
        </div>

        {/* ===== Mode + Undo/Clear ===== */}
        <div className="min-w-0 grid items-end justify-items-stretch md:col-start-3 md:row-start-1">
          <div className="grid gap-2 w-full min-w-0" style={{ maxWidth: ui.shapeW }}>
            <span className={labelCls}>Draw Mode</span>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {/* Draw Mode */}
              <ToggleGroup height={ui.controlH} className="min-w-0">
                <ToggleItem
                  grow
                  active={brush.mode === "draw"}
                  padX={ui.togglePadPx}
                  onClick={() => setBrush((b) => ({ ...b, mode: "draw" }))}
                  title="Draw"
                  isFirst
                >
                  <DrawIcon size={ui.iconPx} />
                </ToggleItem>
                <ToggleItem
                  grow
                  active={brush.mode === "erase"}
                  padX={ui.togglePadPx}
                  onClick={() => setBrush((b) => ({ ...b, mode: "erase" }))}
                  title="Erase"
                >
                  <EraseIcon size={ui.iconPx} />
                </ToggleItem>
              </ToggleGroup>

              {/* Undo and Clear */}
              <div className="ml-auto flex items-center gap-2 shrink-0">
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
                  onClick={() => gridRef.current?.clear()}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Brush Shape ===== */}
        <div className="min-w-0 grid items-end justify-items-stretch md:col-start-3 md:row-start-2">
          <div className="grid gap-2 w-full min-w-0" style={{ maxWidth: ui.shapeW }}>
            <span className={labelCls}>Brush Shape</span>

            {/* flex-wrap OK here; items will fill equally because grow uses flex-1 basis-0 (see ToggleGroup edits below) */}
            <ToggleGroup height={ui.controlH} className="w-full min-w-0 flex-wrap">
              <ToggleItem
                grow
                active={brush.shape === "circle"}
                padX={ui.togglePadPx}
                onClick={() => setBrush((b) => ({ ...b, shape: "circle" }))}
                title="Circle"
                isFirst
              >
                <CircleIcon size={ui.iconPx} />
              </ToggleItem>
              <ToggleItem
                grow
                active={brush.shape === "square"}
                padX={ui.togglePadPx}
                onClick={() => setBrush((b) => ({ ...b, shape: "square" }))}
                title="Square"
              >
                <SquareIcon size={ui.iconPx} />
              </ToggleItem>
              <ToggleItem
                grow
                active={brush.shape === "diamond"}
                padX={ui.togglePadPx}
                onClick={() => setBrush((b) => ({ ...b, shape: "diamond" }))}
                title="Diamond"
              >
                <DiamondIcon size={ui.iconPx} />
              </ToggleItem>
              <ToggleItem
                grow
                active={brush.shape === "cross"}
                padX={ui.togglePadPx}
                onClick={() => setBrush((b) => ({ ...b, shape: "cross" }))}
                title="Cross"
              >
                <CrossIcon size={ui.iconPx} />
              </ToggleItem>
              <ToggleItem
                grow
                active={brush.shape === "hline"}
                padX={ui.togglePadPx}
                onClick={() => setBrush((b) => ({ ...b, shape: "hline" }))}
                title="Horizontal line"
              >
                <HLineIcon size={ui.iconPx} />
              </ToggleItem>
              <ToggleItem
                grow
                active={brush.shape === "vline"}
                padX={ui.togglePadPx}
                onClick={() => setBrush((b) => ({ ...b, shape: "vline" }))}
                title="Vertical line"
              >
                <VLineIcon size={ui.iconPx} />
              </ToggleItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </div>
  );
});
