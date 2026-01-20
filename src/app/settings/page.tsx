"use client";

import { useSettings } from "@/lib/settings/SettingsContext";
import type {
  CenterConvention,
  FFTNormalization,
  MagScale,
  ShiftConvention,
} from "@/lib/settings/types";

export default function SettingsPage() {
  const { settings, setSettings, reset } = useSettings();

  return (
    <main className="p-8 max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-gray-600 mt-1">
            Choose conventions for coordinates and Fourier display.
          </p>
        </div>
        <button className="border rounded px-3 py-2" onClick={reset}>
          Reset
        </button>
      </div>

      {/* Center convention */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Canvas coordinate origin</h2>
        <select
          className="border rounded p-2 w-full"
          value={settings.center}
          onChange={(e) =>
            setSettings((s) => ({ ...s, center: e.target.value as CenterConvention }))
          }
        >
          <option value="centerPixel">Bottom right middle pixel is (0,0)</option>
          <option value="centerBetween">Between middle pixels is (0,0)</option>
          <option value="topLeft">Top-left is (0,0)</option>
        </select>
        <p className="text-sm text-gray-600">
          This affects the crosshair/axis overlay (and later any coordinate readouts).
        </p>
      </section>

      {/* Shift convention */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">DFT display shift (fftshift)</h2>
        <select
          className="border rounded p-2 w-full"
          value={settings.shift}
          onChange={(e) =>
            setSettings((s) => ({ ...s, shift: e.target.value as ShiftConvention }))
          }
        >
          <option value="shifted">Shifted (DC centered)</option>
          <option value="unshifted">Unshifted (DC at top-left)</option>
        </select>
      </section>

      {/* Magnitude scale */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Magnitude scale</h2>
        <select
          className="border rounded p-2 w-full"
          value={settings.magScale}
          onChange={(e) =>
            setSettings((s) => ({ ...s, magScale: e.target.value as MagScale }))
          }
        >
          <option value="linear">Linear</option>
          <option value="log">Log (log1p)</option>
        </select>
      </section>

      {/* Normalization */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">DFT normalization</h2>
        <select
          className="border rounded p-2 w-full"
          value={settings.normalization}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              normalization: e.target.value as FFTNormalization,
            }))
          }
        >
          <option value="forward">Forward (1/N)</option>
          <option value="inverse">Inverse (1/N)</option>
          <option value="unitary">Unitary (1/√N on both)</option>
          <option value="none">None</option>
        </select>
        <p className="text-sm text-gray-600">
          N is the total number of samples (for 2D: width×height).
        </p>
      </section>
    </main>
  );
}
