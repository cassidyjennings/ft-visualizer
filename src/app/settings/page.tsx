"use client";

import React from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import type {
  CenterConvention,
  FFTNormalization,
  MagScale,
  ShiftConvention,
} from "@/lib/settings/types";

import { ToggleGroup, ToggleItem } from "@/components/ui/ToggleGroup";
import { Sun, Moon } from "lucide-react";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function GHCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="divide-y border-t">{children}</div>
    </section>
  );
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("px-5 py-4", "hover:bg-muted/40", className)}>{children}</div>
  );
}

function LabelBlock({
  label,
  description,
}: {
  label: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      {description ? (
        <div className="text-sm text-muted-foreground">{description}</div>
      ) : null}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm",
        "text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-(--ring)",
        className,
      )}
    >
      {children}
    </select>
  );
}

function Segmented({
  disabled,
  children,
}: {
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "inline-flex rounded-md border bg-background overflow-hidden",
        disabled && "opacity-60",
      )}
    >
      <ToggleGroup height={40} className="flex">
        {children}
      </ToggleGroup>
    </div>
  );
}

function SegItem({
  value,
  currentValue,
  onSelect,
  disabled,
  children,
}: {
  value: string;
  currentValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ToggleItem
      active={currentValue === value}
      onClick={() => {
        if (disabled) return;
        onSelect(value);
      }}
      className={cx(
        "rounded-none border-0 px-3 py-2 text-sm font-medium",
        "text-foreground/85 hover:bg-muted",
        "data-[state=on]:bg-muted data-[state=on]:text-foreground",
        "transition",
      )}
    >
      {children}
    </ToggleItem>
  );
}

function CheckboxRow({
  checked,
  onCheckedChange,
  label,
  description,
  resultText,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  description?: React.ReactNode;
  resultText: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className={cx("mt-0.5 h-4 w-4 rounded border bg-background", "accent-foreground")}
      />
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {description ? (
          <div className="text-sm text-muted-foreground">{description}</div>
        ) : null}
        <div className="text-sm text-muted-foreground">{resultText}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, setSettings, reset } = useSettings();

  type ColoringMode = "system" | "light" | "dark";

  // ===== Derived display strings (for “result text under checkbox option”) =====
  const isShifted = settings.shift === ("shifted" as ShiftConvention);
  const shiftResult = isShifted
    ? "Result: DC (0 frequency) is centered in the spectrum."
    : "Result: DC appears at the top-left (unshifted display).";

  const useOS = settings.coloring === ("system" as ColoringMode);
  const effectiveIfSystem = "Result: Theme follows your OS preference.";
  const effectiveIfManual =
    settings.coloring === "dark"
      ? "Result: Dark theme is forced."
      : "Result: Light theme is forced.";

  const manualThemeLabel =
    settings.coloring === "dark"
      ? "Selected: Dark"
      : settings.coloring === "light"
        ? "Selected: Light"
        : "Selected: (none)";

  return (
    <main className="mx-auto w-full max-w-4xl p-6 sm:p-8 space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose conventions for coordinates and Fourier display.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className={cx(
            "shrink-0 rounded-md border px-3 py-2 text-sm font-semibold",
            "bg-card text-foreground hover:bg-muted",
            "active:scale-[0.98] transition",
          )}
        >
          Reset
        </button>
      </div>

      {/* DFT Magnitude display (one card) */}
      <GHCard
        title="DFT Magnitude display"
        subtitle="Controls how the magnitude spectrum is presented."
      >
        {/* Display shift (checkbox) */}
        <Row>
          <CheckboxRow
            checked={isShifted}
            onCheckedChange={(next) =>
              setSettings((s) => ({
                ...s,
                shift: (next ? "shifted" : "unshifted") as ShiftConvention,
              }))
            }
            label="Center DC (fftshift)"
            description="Shift the spectrum so the zero frequency sits in the center."
            resultText={shiftResult}
          />
        </Row>

        {/* Magnitude scale (segmented) */}
        <Row>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LabelBlock
              label="Magnitude scale"
              description="Use log for better visibility when values span a large range."
            />
            <Segmented
            >
              <SegItem
                value="linear"
                currentValue={settings.magScale}
                onSelect={(v) => setSettings((s) => ({ ...s, magScale: v as MagScale }))}
              >
                Linear
              </SegItem>
              <SegItem
                value="log"
                currentValue={settings.magScale}
                onSelect={(v) => setSettings((s) => ({ ...s, magScale: v as MagScale }))}
              >
                Log (log1p)
              </SegItem>
            </Segmented>
          </div>
        </Row>
      </GHCard>

      {/* Conventions card */}
      <GHCard
        title="Conventions"
        subtitle="These affect the coordinate system and DFT normalization rules."
      >
        {/* Center convention (dropdown) */}
        <Row>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LabelBlock
              label="Canvas coordinate origin"
              description="Affects the crosshair/axis overlay."
            />
            <div className="w-full sm:w-auto">
              <Select
                value={settings.center}
                onChange={(v) =>
                  setSettings((s) => ({ ...s, center: v as CenterConvention }))
                }
                className="sm:w-85"
              >
                <option value="centerPixel">Bottom-right middle pixel is (0,0)</option>
                <option value="centerBetween">Between middle pixels is (0,0)</option>
                <option value="topLeft">Top-left is (0,0)</option>
              </Select>
            </div>
          </div>
        </Row>

        {/* Normalization (dropdown) */}
        <Row>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LabelBlock
              label="DFT normalization"
              description="N is the total number of samples (2D: width×height)."
            />
            <div className="w-full sm:w-auto">
              <Select
                value={settings.normalization}
                onChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    normalization: v as FFTNormalization,
                  }))
                }
                className="sm:w-85"
              >
                <option value="forward">Forward (1/N)</option>
                <option value="inverse">Inverse (1/N)</option>
                <option value="unitary">Unitary (1/√N on both)</option>
                <option value="none">None</option>
              </Select>
            </div>
          </div>
        </Row>
      </GHCard>

      {/* Theme (own row/card) */}
      <GHCard title="Theme" subtitle="Pick your preferred appearance.">
        <Row>
          <div className="flex flex-col gap-3">
            <CheckboxRow
              checked={useOS}
              onCheckedChange={(next) =>
                setSettings((s) => ({
                  ...s,
                  coloring: (next ? "system" : "light") as ColoringMode,
                }))
              }
              label="Use OS settings"
              description="Automatically switch between light and dark based on your system."
              resultText={useOS ? effectiveIfSystem : effectiveIfManual}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pl-7">
              <div className="text-sm font-semibold text-foreground">Manual theme</div>

              <div className="space-y-1">
                <Segmented
                  disabled={useOS}
                >
                  <SegItem
                    value="light"
                    currentValue={
                      (useOS
                        ? settings.coloring === "dark"
                          ? "dark"
                          : "light"
                        : settings.coloring) as string
                    }
                    onSelect={(v) => setSettings((s) => ({ ...s, coloring: v as ColoringMode }))}
                    disabled={useOS}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="sr-only">Light</span>
                  </SegItem>
                  <SegItem
                    value="dark"
                    currentValue={
                      (useOS
                        ? settings.coloring === "dark"
                          ? "dark"
                          : "light"
                        : settings.coloring) as string
                    }
                    onSelect={(v) => setSettings((s) => ({ ...s, coloring: v as ColoringMode }))}
                    disabled={useOS}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="sr-only">Dark</span>
                  </SegItem>
                </Segmented>

                {useOS ? (
                  <div className="text-sm text-muted-foreground">
                    Disabled while using OS settings. {manualThemeLabel}.
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {settings.coloring === "dark"
                      ? "Result: Dark theme is forced."
                      : "Result: Light theme is forced."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Row>
      </GHCard>
    </main>
  );
}
