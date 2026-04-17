"use client";

import type { SignalLayer } from "@/lib/signals/types";

type SignalControlsProps = {
  N: number;
  onNChange: (n: number) => void;
  userInputLayer: SignalLayer;
  onUserInputChange: (layer: SignalLayer) => void;
  onUndo?: () => void;
  onClear?: () => void;
  maxWidth?: number;
};

const CONTROL_H = 30;

function btnBase() {
  return [
    "inline-flex items-center justify-center",
    "border rounded",
    "hover:bg-fg/10 active:scale-95 transition",
    "select-none text-sm",
    "bg-card border-border/80",
  ].join(" ");
}

export default function SignalControls({
  N,
  onNChange,
  userInputLayer,
  onUserInputChange,
  onUndo,
  onClear,
  maxWidth,
}: SignalControlsProps) {
  return (
    <div className="mt-1 w-full min-w-0" style={{ maxWidth }}>
      <div
        className={[
          "min-w-0 shadow",
          "rounded-xl border border-border",
          "bg-card/80",
          "p-2 sm:p-3",
        ].join(" ")}
      >
        <div
          className={[
            "grid min-w-0",
            "grid-cols-1 gap-2",
            "md:grid-cols-[1.3fr_0.7fr]",
            "md:gap-0 md:divide-x md:divide-border",
          ].join(" ")}
        >
          {/* ========== LEFT: Signal Length ========== */}
          <section className="min-w-0 grid gap-1 md:pr-3 content-start">
            <span className="font-semibold text-sm">Signal Length</span>
            <div className="flex items-center justify-between">
              <span className="text-fg/70 text-xs font-medium">N</span>
              <span className="tabular-nums text-xs">{N}</span>
            </div>
            <div
              className="border border-border rounded bg-card px-2 flex items-center min-w-0"
              style={{ height: CONTROL_H }}
            >
              <input
                type="range"
                min={4}
                max={64}
                step={1}
                value={N}
                onChange={(e) => onNChange(Number(e.target.value))}
                className="w-full min-w-0 cursor-pointer"
              />
            </div>
          </section>

          {/* ========== RIGHT: User Input + Undo/Clear ========== */}
          <section className="min-w-0 grid gap-1 md:pl-3 content-start">
            <span className="font-semibold text-sm flex items-center gap-1.5">
              Actions
            </span>
            <span className="text-fg/70 text-xs font-medium">User Input History</span>

            {/* Undo / Clear */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={btnBase()}
                style={{ height: CONTROL_H + 1 }}
                onClick={onUndo}
              >
                Undo
              </button>
              <button
                type="button"
                className={btnBase()}
                style={{ height: CONTROL_H }}
                onClick={onClear}
              >
                Clear
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
