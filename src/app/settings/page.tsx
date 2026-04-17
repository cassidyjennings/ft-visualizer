"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

import { CheckboxOption } from "@/components/ui/CheckboxOption";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { ToggleGroup, ToggleItem } from "@/components/ui/ToggleGroup";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";
import type {
  Axis1DOrigin,
  CenterConvention,
  FFTNormalization,
  MagScale,
  ShiftConvention,
} from "@/lib/settings/types";

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
    <section className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold font-serif text-fg">{title}</h2>
        {subtitle ? (
          <p className="max-w-3xl text-sm leading-6 text-fg/70">{subtitle}</p>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card/80 shadow-sm">
        <div className="divide-y divide-border">{children}</div>
      </div>
    </section>
  );
}

function SectionBreak() {
  return <hr className="border-border" />;
}

function SettingRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "px-4 py-4 sm:px-5 sm:py-5",
        "transition-colors hover:bg-fg/3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SettingSplit({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DescriptionStack({
  label,
  description,
}: {
  label: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-sm font-medium font-serif text-fg">{label}</div>
      {description ? (
        <div className="max-w-2xl text-sm leading-6 text-fg/70">{description}</div>
      ) : null}
    </div>
  );
}

function PreviewText({
  description,
  resultText,
}: {
  description?: React.ReactNode;
  resultText?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {description ? <div>{description}</div> : null}
      {resultText ? <div>{resultText}</div> : null}
    </div>
  );
}

function DisabledPanel({
  disabled,
  children,
}: {
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-disabled={disabled}
      className={cx(
        "rounded-lg border border-border bg-card px-4 py-3 transition-opacity",
        disabled && "opacity-55",
      )}
    >
      {children}
    </div>
  );
}

function CardToggleGroup({
  value,
  onValueChange,
  disabled,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactElement<CardToggleItemProps>[];
}) {
  return (
    <ToggleGroup
      height={38}
      className={cx("w-full min-w-0 sm:w-auto", disabled && "opacity-60")}
      borderColor="border"
    >
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          active: child.props.value === value,
          disabled,
          isFirst: index === 0,
          onClick: () => {
            if (!disabled) onValueChange(child.props.value);
          },
        }),
      )}
    </ToggleGroup>
  );
}

type CardToggleItemProps = {
  value: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
  onClick?: () => void;
};

function CardToggleItem({
  children,
  active,
  disabled,
  isFirst,
  onClick,
}: CardToggleItemProps) {
  return (
    <ToggleItem
      grow
      active={Boolean(active)}
      onClick={() => {
        if (!disabled) onClick?.();
      }}
      isFirst={isFirst}
      className={cx(
        "px-3 text-sm font-medium text-fg/85",
        disabled && "cursor-not-allowed",
      )}
    >
      {children}
    </ToggleItem>
  );
}

function ThemeModeToggle({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      height={38}
      className={cx("w-full sm:w-auto", disabled && "opacity-60")}
      borderColor="border"
    >
      <ToggleItem
        grow
        active={value === "light"}
        padX={14}
        onClick={() => {
          if (!disabled) onValueChange("light");
        }}
        title="Light"
        isFirst
        className={cx(disabled && "cursor-not-allowed")}
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light</span>
      </ToggleItem>
      <ToggleItem
        grow
        active={value === "dark"}
        padX={14}
        onClick={() => {
          if (!disabled) onValueChange("dark");
        }}
        title="Dark"
        className={cx(disabled && "cursor-not-allowed")}
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark</span>
      </ToggleItem>
    </ToggleGroup>
  );
}

export default function SettingsPage() {
  const { settings, setSettings, reset } = useSettings();

  type ColoringMode = "system" | "light" | "dark";

  const effectiveColoring = useEffectiveColoring(settings.coloring);
  const isShifted = settings.shift === ("shifted" as ShiftConvention);
  const shiftResult = isShifted
    ? "Result: Zero frequency is centered in the magnitude display."
    : "Result: Zero frequency appears at the top-left of the magnitude display.";

  const useOS = settings.coloring === ("system" as ColoringMode);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Choose conventions for coordinates, Fourier display, and appearance.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded border border-border bg-brand-2 px-3 text-sm text-brand-contrast shadow-sm transition hover:bg-brand active:scale-95"
        >
          Reset to Default Settings
        </button>
      </div>

      <GHCard
        title="DFT Magnitude display"
        subtitle="Controls how the magnitude spectrum is presented."
      >
        <SettingRow>
          <CheckboxOption
            checked={isShifted}
            onCheckedChange={(next) =>
              setSettings((s) => ({
                ...s,
                shift: (next ? "shifted" : "unshifted") as ShiftConvention,
              }))
            }
            label="Center DC"
            selectedPreview={
              <PreviewText
                description="Shift the spectrum so the zero-frequency component (the signal’s average level) is displayed in the center rather than at the edges."
                resultText={shiftResult}
              />
            }
            unselectedPreview={
              <PreviewText
                description="Shift the spectrum so the zero-frequency component (the signal’s average level) is displayed in the center rather than at the edges."
                resultText={shiftResult}
              />
            }
          />
        </SettingRow>

        <SettingRow>
          <SettingSplit>
            <DescriptionStack
              label="Magnitude scale"
              description="Use log for better visibility when Fourier transform values span a large range."
            />
            <CardToggleGroup
              value={settings.magScale}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, magScale: v as MagScale }))
              }
            >
              {[
                <CardToggleItem key="linear" value="linear">
                  Linear
                </CardToggleItem>,
                <CardToggleItem key="log" value="log">
                  Log
                </CardToggleItem>,
              ]}
            </CardToggleGroup>
          </SettingSplit>
        </SettingRow>
      </GHCard>

      <SectionBreak />

      <GHCard
        title="Conventions"
        subtitle="These affect the coordinate system and DFT normalization rules."
      >
        <SettingRow>
          <SettingSplit>
            <DescriptionStack
              label="Coordinate origins"
              description="Controls where the origin appears on each visualizer's axes. 1D affects the n = 0 position on the axis page; 2D affects the crosshair and overlay on the drawing canvas."
            />
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              {/* 1D Axis origin */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs font-semibold text-fg/60">1D Axis</span>
                <CardToggleGroup
                  value={settings.axis1DOrigin}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, axis1DOrigin: v as Axis1DOrigin }))
                  }
                >
                  {[
                    <CardToggleItem key="left" value="left">
                      Left
                    </CardToggleItem>,
                    <CardToggleItem key="center" value="center">
                      Center
                    </CardToggleItem>,
                  ]}
                </CardToggleGroup>
              </div>

              {/* 2D Canvas origin */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs font-semibold text-fg/60">2D Canvas</span>
                <DropdownSelect
                  value={settings.center}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, center: v as CenterConvention }))
                  }
                  options={[
                    { value: "centerPixel", label: "Center pixel (bottom-right)" },
                    { value: "centerBetween", label: "Between center pixels" },
                    { value: "topLeft", label: "Top-left pixel" },
                  ]}
                  className="w-full"
                  selectClassName="h-[38px] w-full border-border bg-card px-3"
                />
              </div>
            </div>
          </SettingSplit>
        </SettingRow>

        <SettingRow>
          <SettingSplit>
            <DescriptionStack
              label="DFT normalization"
              description="N is the number of samples in the transform (i.e. number of squares on the draw canvas grid)."
            />
            <div className="w-full space-y-2 lg:w-88">
              <DropdownSelect
                value={settings.normalization}
                onChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    normalization: v as FFTNormalization,
                  }))
                }
                options={[
                  { value: "forward", label: "Forward (1/N)" },
                  { value: "inverse", label: "Inverse (1/N)" },
                  { value: "unitary", label: "Unitary (1/sqrt(N) on both)" },
                  { value: "none", label: "None" },
                ]}
                className="w-full"
                selectClassName="h-12 w-full border-border bg-card px-3"
              />
            </div>
          </SettingSplit>
        </SettingRow>
      </GHCard>

      <SectionBreak />

      <GHCard title="Theme" subtitle="Pick your preferred appearance.">
        <SettingRow>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.95fr)]">
            <DisabledPanel disabled={false}>
              <CheckboxOption
                checked={useOS}
                onCheckedChange={(next) =>
                  setSettings((s) => ({
                    ...s,
                    coloring: (next ? "system" : "light") as ColoringMode,
                  }))
                }
                label="Use OS settings"
                selectedPreview={
                  <PreviewText resultText="Result: App appearance matches OS settings." />
                }
                unselectedPreview={
                  <PreviewText resultText="Result: App appearance matches selected theme." />
                }
              />
            </DisabledPanel>

            <DisabledPanel disabled={useOS}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="text-md font-medium font-serif text-fg">
                    Manual theme
                  </div>

                  <div className="text-sm leading-5 text-fg/70 lg:max-w-sm">
                    {useOS
                      ? `Disabled while using OS settings.`
                      : "Select theme for app appearance."}
                  </div>
                </div>
                <ThemeModeToggle
                  value={useOS ? effectiveColoring : settings.coloring}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, coloring: v as ColoringMode }))
                  }
                  disabled={useOS}
                />
              </div>
            </DisabledPanel>
          </div>
        </SettingRow>
      </GHCard>
    </main>
  );
}
