"use client";

import type { SignalLayer, SignalType } from "@/lib/signals/types";
import { SIGNAL_TYPE_OPTIONS } from "@/lib/signals/types";
import { X } from "lucide-react";

const CARD_H = 36;

type SignalLayerCardProps = {
  layer: SignalLayer;
  onChange: (updated: SignalLayer) => void;
  onBeforeChange?: () => void;
  onRemove?: () => void;
  maxPeriod: number;
};

function compactInput({
  label,
  value,
  onChange,
  onFocus,
  min,
  max,
  step,
  disabled,
  className = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onFocus?: () => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={["flex items-center gap-1 min-w-0", className].join(" ")}>
      <span className="text-fg/60 text-xs font-medium whitespace-nowrap">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step ?? 0.1}
        value={value}
        disabled={disabled}
        onFocus={onFocus}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className={[
          "w-16 min-w-0 tabular-nums text-xs text-center",
          "border border-border/60 rounded bg-card px-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
        style={{ height: CARD_H - 8 }}
      />
    </label>
  );
}

export default function SignalLayerCard({
  layer,
  onChange,
  onBeforeChange,
  onRemove,
  maxPeriod,
}: SignalLayerCardProps) {
  const isUserInput = layer.type === "user-input";

  return (
    <div
      className={[
        "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 min-w-0",
        "rounded-lg border border-border/80 bg-card/80",
        "shadow-sm",
      ].join(" ")}
      style={{ height: CARD_H }}
    >
      {/* Remove button or indicator */}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title="Remove signal"
          className="shrink-0 text-fg/50 hover:text-fg transition p-0.5 -ml-0.5"
        >
          <X size={14} />
        </button>
      ) : (
        <span
          className="shrink-0 w-2 h-2 rounded-full bg-brand/70"
          title="User Input (always active)"
        />
      )}

      {/* Type selector */}
      {isUserInput ? (
        <span className="text-xs font-semibold text-fg/80 whitespace-nowrap">
          User Input
        </span>
      ) : (
        <select
          value={layer.type}
          onMouseDown={onBeforeChange}
          onChange={(e) => onChange({ ...layer, type: e.target.value as SignalType })}
          className={[
            "text-xs font-medium bg-card border border-border/60 rounded",
            "px-1 min-w-0 cursor-pointer",
          ].join(" ")}
          style={{ height: CARD_H - 8 }}
        >
          {SIGNAL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Amplitude */}
      {compactInput({
        label: "Amplitude",
        value: layer.amplitude,
        onChange: (v) => onChange({ ...layer, amplitude: v }),
        onFocus: onBeforeChange,
        step: 0.1,
        disabled: isUserInput,
      })}

      {/* Shift + Period sliders — hidden for user-input and constant */}
      {!isUserInput && layer.type !== "constant" && (
        <label className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-fg/60 text-xs font-medium whitespace-nowrap">Shift</span>
          <span className="tabular-nums text-xs w-5 text-center shrink-0">
            {layer.phaseShift ?? 0}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(layer.period - 1, 1)}
            step={1}
            value={Math.min(layer.phaseShift ?? 0, layer.period - 1)}
            onPointerDown={onBeforeChange}
            onChange={(e) => onChange({ ...layer, phaseShift: Number(e.target.value) })}
            className="flex-1 min-w-0 cursor-pointer"
            style={{ height: 16 }}
          />
        </label>
      )}
      {!isUserInput && layer.type !== "constant" && (
        <label className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-fg/60 text-xs font-medium whitespace-nowrap">Period</span>
          <span className="tabular-nums text-xs w-5 text-center shrink-0">
            {layer.period}
          </span>
          <input
            type="range"
            min={2}
            max={maxPeriod}
            step={1}
            value={Math.min(layer.period, maxPeriod)}
            onPointerDown={onBeforeChange}
            onChange={(e) => {
              const newPeriod = Number(e.target.value);
              const clampedShift = Math.min(layer.phaseShift ?? 0, newPeriod - 1);
              onChange({ ...layer, period: newPeriod, phaseShift: clampedShift });
            }}
            className="flex-1 min-w-0 cursor-pointer"
            style={{ height: 16 }}
          />
        </label>
      )}
    </div>
  );
}
