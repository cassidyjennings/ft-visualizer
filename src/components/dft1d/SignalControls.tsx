"use client";

import { ToggleGroup, ToggleItem } from "@/components/ui/ToggleGroup";

type PresetType = "zero" | "sine" | "cosine" | "square";

type SignalControlsProps = {
  N: number;
  onNChange: (n: number) => void;
  period: number;
  onPeriodChange: (p: number) => void;
  onPreset: (type: PresetType) => void;
  onUndo?: () => void;
  onClear?: () => void;
  maxWidth?: number;
};

const CONTROL_H = 30;
const TOGGLE_PAD = 10;

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
  period,
  onPeriodChange,
  onPreset,
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
            "md:grid-cols-[0.7fr_1.3fr]",
            "md:gap-0 md:divide-x md:divide-border",
          ].join(" ")}
        >
          {/* ========== LEFT: N + Undo/Clear ========== */}
          <section className="min-w-0 grid gap-2 md:pr-3 content-start">
            <span className="font-semibold">Signal Length</span>
            <div className="grid gap-1">
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
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={btnBase()}
                style={{ height: CONTROL_H }}
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

          {/* ========== RIGHT: Function Presets + Period ========== */}
          <section className="min-w-0 grid gap-2 md:pl-3 content-start">
            <span className="font-semibold">Function Presets</span>
            <ToggleGroup
              height={CONTROL_H}
              className="w-full min-w-0"
              borderColor="border"
            >
              <ToggleItem
                grow
                active={false}
                padX={TOGGLE_PAD}
                onClick={() => onPreset("zero")}
                title="Set all samples to zero"
                isFirst
              >
                Zero
              </ToggleItem>
              <ToggleItem
                grow
                active={false}
                padX={TOGGLE_PAD}
                onClick={() => onPreset("sine")}
                title="Generate sine wave"
              >
                Sine
              </ToggleItem>
              <ToggleItem
                grow
                active={false}
                padX={TOGGLE_PAD}
                onClick={() => onPreset("cosine")}
                title="Generate cosine wave"
              >
                Cosine
              </ToggleItem>
              <ToggleItem
                grow
                active={false}
                padX={TOGGLE_PAD}
                onClick={() => onPreset("square")}
                title="Generate square wave"
              >
                Square
              </ToggleItem>
            </ToggleGroup>

            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className="text-fg/70 text-xs font-medium">Period P (samples)</span>
                <span className="tabular-nums text-xs">{period}</span>
              </div>
              <div
                className="border border-border rounded bg-card px-2 flex items-center min-w-0"
                style={{ height: CONTROL_H }}
              >
                <input
                  type="range"
                  min={2}
                  max={N}
                  step={1}
                  value={Math.min(period, N)}
                  onChange={(e) => onPeriodChange(Number(e.target.value))}
                  className="w-full min-w-0 cursor-pointer"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
