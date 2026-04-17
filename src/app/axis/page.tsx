"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import TransformButton from "@/components/ui/TransformButton";
import StemPlotCanvas from "@/components/dft1d/StemPlotCanvas";
import SignalControls from "@/components/dft1d/SignalControls";
import SignalLayerCard from "@/components/dft1d/SignalLayerCard";
import { dft } from "@/lib/fft/dft";
import { evaluateMix, sumOtherLayersAt } from "@/lib/signals/evaluate";
import type { SignalLayer, SignalType } from "@/lib/signals/types";
import { newLayerId } from "@/lib/signals/types";
import { Plus } from "lucide-react";

const USER_INPUT_ID = "user-input";

const PI_TICKS = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI];

/**
 * Circular shift so the zero-frequency bin (index 0) moves to the centre.
 * Equivalent to NumPy / MATLAB fftshift: shift = ceil(N/2).
 */
function fftshift(arr: number[]): number[] {
  const N = arr.length;
  if (N === 0) return [];
  const shift = Math.ceil(N / 2);
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

function formatPi(v: number): string {
  if (Math.abs(v - Math.PI) < 0.01) return "\u03C0";
  if (Math.abs(v + Math.PI) < 0.01) return "-\u03C0";
  if (Math.abs(v - Math.PI / 2) < 0.01) return "\u03C0/2";
  if (Math.abs(v + Math.PI / 2) < 0.01) return "-\u03C0/2";
  return "0";
}

function makeUserInputLayer(): SignalLayer {
  return {
    id: USER_INPUT_ID,
    type: "user-input",
    amplitude: 1,
    coefficient: 1,
    period: 8,
  };
}

function makeDefaultLayer(type: SignalType = "sine", period: number = 8): SignalLayer {
  return {
    id: newLayerId(),
    type,
    amplitude: 1,
    coefficient: 1,
    period,
  };
}

export default function Axis1DPage() {
  const { settings } = useSettings();

  const [N, setN] = useState(16);
  const [layers, setLayers] = useState<SignalLayer[]>([makeUserInputLayer()]);
  const [userInputData, setUserInputData] = useState<number[]>(
    () => new Array(16).fill(0),
  );

  const [hasTransformed, setHasTransformed] = useState(false);
  const [dftResult, setDftResult] = useState<{
    real: Float32Array;
    imag: Float32Array;
  } | null>(null);

  // Undo history (tracks userInputData changes)
  const [history, setHistory] = useState<number[][]>([]);
  const userInputRef = useRef(userInputData);
  userInputRef.current = userInputData;

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), [...userInputRef.current]]);
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUserInputData((current) => {
        // Resize the restored snapshot to match current N so lengths stay in sync
        if (last.length === current.length) return last;
        const resized = new Array(current.length).fill(0);
        for (let i = 0; i < Math.min(last.length, current.length); i++) {
          resized[i] = last[i];
        }
        return resized;
      });
      return prev.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    pushHistory();
    setUserInputData((prev) => new Array(prev.length).fill(0));
  }, [pushHistory]);

  // Handle N change — preserve user input values, new stems default to 0
  const handleNChange = useCallback((newN: number) => {
    setN(newN);
    setUserInputData((prev) => {
      const next = new Array(newN).fill(0);
      for (let i = 0; i < Math.min(prev.length, newN); i++) {
        next[i] = prev[i];
      }
      return next;
    });
    // Clamp layer periods to new N
    setLayers((prev) =>
      prev.map((l) => (l.period > newN ? { ...l, period: newN } : l)),
    );
  }, []);

  // Compute mixed samples from all layers
  const samples = useMemo(
    () => evaluateMix(layers, N, userInputData),
    [layers, N, userInputData],
  );

  // Compute y-axis range from actual signal data, snapped to nice values
  const yRange = useMemo(() => {
    let peak = 0;
    for (const v of samples) {
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
    }
    // Snap to next nice round number (0.5, 1, 1.5, 2, 3, 4, 5, ...)
    const raw = peak * 1.1;
    if (raw <= 0.5) return 1;
    if (raw <= 1) return 1;
    if (raw <= 1.5) return 1.5;
    if (raw <= 2) return 2;
    return Math.ceil(raw);
  }, [samples]);

  const inputYTicks = useMemo(() => {
    const bound = yRange;
    const ticks: number[] = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      ticks.push(-bound + (i / count) * 2 * bound);
    }
    return ticks;
  }, [yRange]);

  // Keep a ref to samples for DFT
  const samplesRef = useRef(samples);
  samplesRef.current = samples;

  // Handle individual stem drag — updates userInputData
  const isDragging = useRef(false);
  const handleDrag = useCallback(
    (index: number, value: number) => {
      if (!isDragging.current) {
        isDragging.current = true;
        pushHistory();
      }
      // Compute what the other layers contribute at this index,
      // then set userInput so that the mixed value = dragged value
      const otherSum = sumOtherLayersAt(layers, N, index);
      setUserInputData((prev) => {
        const next = [...prev];
        // Account for user-input amplitude (always 1, but be safe)
        const uiLayer = layers.find((l) => l.type === "user-input");
        const amp = uiLayer?.amplitude ?? 1;
        next[index] = amp !== 0 ? (value - otherSum) / amp : 0;
        return next;
      });
    },
    [pushHistory, layers, N],
  );

  // Reset drag flag on pointer up
  useEffect(() => {
    const up = () => {
      isDragging.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  // Layer management
  const addLayer = useCallback(
    (type: SignalType = "sine") => {
      setLayers((prev) => [...prev, makeDefaultLayer(type, Math.min(8, N))]);
    },
    [N],
  );

  const updateLayer = useCallback((updated: SignalLayer) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l)),
    );
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Compute DFT
  const handleTransform = useCallback(() => {
    const result = dft(samplesRef.current, settings.normalization);
    setDftResult(result);
    setHasTransformed(true);
  }, [settings.normalization]);

  // Recompute when normalization setting changes
  useEffect(() => {
    if (!hasTransformed) return;
    const result = dft(samplesRef.current, settings.normalization);
    setDftResult(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.normalization]);

  // Compute display magnitudes and phases from raw DFT result
  const { magnitudes, phases, magYMax, magTicks } = useMemo(() => {
    if (!dftResult)
      return { magnitudes: null, phases: null, magYMax: 1, magTicks: [0, 0.5, 1] };

    const len = dftResult.real.length;
    const mags: number[] = new Array(len);
    const phs: number[] = new Array(len);

    for (let k = 0; k < len; k++) {
      let mag = Math.sqrt(dftResult.real[k] ** 2 + dftResult.imag[k] ** 2);
      if (settings.magScale === "log") mag = Math.log10(1 + mag);
      mags[k] = mag;
      phs[k] = Math.atan2(dftResult.imag[k], dftResult.real[k]);
    }

    let maxMag = Math.max(...mags, 1e-10);
    if (settings.magNormalize === "max") {
      for (let k = 0; k < len; k++) mags[k] /= maxMag;
      maxMag = 1;
    }

    const yMax = maxMag;
    const count = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push((i / count) * yMax);
    }

    return { magnitudes: mags, phases: phs, magYMax: yMax, magTicks: ticks };
  }, [dftResult, settings.magScale, settings.magNormalize]);

  // Apply the origin convention for display
  const isOriginCenter = settings.axis1DOrigin === "center";
  const xOffset = isOriginCenter ? -Math.floor(N / 2) : 0;

  // For the output plots, shift the bins so DC sits in the centre when requested
  const displayMagnitudes = useMemo(
    () => (isOriginCenter && magnitudes ? fftshift(magnitudes) : magnitudes),
    [isOriginCenter, magnitudes],
  );
  const displayPhases = useMemo(
    () => (isOriginCenter && phases ? fftshift(phases) : phases),
    [isOriginCenter, phases],
  );

  // Format magnitude tick labels
  const magTickFormat = useCallback(
    (v: number) => {
      if (settings.magNormalize === "max") return v.toFixed(2);
      if (v === 0) return "0";
      if (v >= 100) return v.toFixed(0);
      if (v >= 10) return v.toFixed(1);
      return v.toFixed(2);
    },
    [settings.magNormalize],
  );

  // Separate user-input layer and other layers for rendering
  const userInputLayer = layers.find((l) => l.id === USER_INPUT_ID)!;
  const signalLayers = layers.filter((l) => l.id !== USER_INPUT_ID);

  return (
    <div
      className="w-full flex items-stretch gap-8 min-h-0 px-4 sm:px-6 lg:px-10"
      style={{ height: "calc(100svh - 9rem)" }}
    >
      {/* =================== LEFT: Input Signal + Controls =================== */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2 overflow-hidden">
        <div className="text-md lg:text-lg text-fg font-serif font-semibold text-center w-full shrink-0">
          Input Signal x[n]
        </div>
        {/* Canvas — takes ~55% of column, never shrinks below that */}
        <div className="shrink-0 min-h-0" style={{ flex: "1 0 55%" }}>
          <StemPlotCanvas
            data={samples}
            yMin={-yRange}
            yMax={yRange}
            xLabel="n"
            yLabel="x[n]"
            interactive
            onDrag={handleDrag}
            yTicks={inputYTicks}
            baselineY={0}
            xOffset={xOffset}
          />
        </div>

        {/* Control panel */}
        <div className="shrink-0">
          <SignalControls
            N={N}
            onNChange={handleNChange}
            userInputLayer={userInputLayer}
            onUserInputChange={updateLayer}
            onUndo={handleUndo}
            onClear={handleClear}
          />
        </div>

        {/* Signal layer cards — scrollable when many */}
        <div className="shrink min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
          {signalLayers.map((layer) => (
            <SignalLayerCard
              key={layer.id}
              layer={layer}
              onChange={updateLayer}
              onRemove={() => removeLayer(layer.id)}
              maxPeriod={N}
            />
          ))}

          {/* Add signal button */}
          <button
            type="button"
            onClick={() => addLayer("sine")}
            className={[
              "flex items-center justify-center gap-1.5",
              "w-full rounded-lg border border-dashed border-border/60",
              "bg-card/40 hover:bg-fg/5 active:scale-[0.99] transition",
              "text-xs text-fg/50 hover:text-fg/70 font-medium",
              "py-1 shrink-0",
            ].join(" ")}
          >
            <Plus size={13} />
            Add Signal
          </button>
        </div>
      </div>

      {/* =================== CENTER: Transform Arrow =================== */}
      <div className="shrink-0 flex flex-col items-center justify-center">
        <div
          className="max-w-[18rem] text-center text-sm font-serif invisible pointer-events-none select-none"
          aria-hidden
        >
          Click <span className="font-serif">{"\u279c"}</span> to transform.
        </div>

        <TransformButton onClick={handleTransform} />

        <div
          className={[
            "mt-2 max-w-[18rem] text-center text-sm font-serif text-fg/85",
            hasTransformed ? "invisible" : "visible",
          ].join(" ")}
          aria-hidden={hasTransformed}
        >
          Click <span className="font-serif text-brand">{"\u279c"}</span> to transform.
        </div>
      </div>

      {/* =================== RIGHT: DFT Output =================== */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">
        {/* Magnitude */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-md lg:text-lg text-fg font-serif font-semibold text-center shrink-0">
            Magnitude |X[k]|
          </div>
          <div className="flex-1 min-h-0">
            <StemPlotCanvas
              data={displayMagnitudes}
              yMin={0}
              yMax={magYMax}
              xLabel="k"
              yLabel={settings.magScale === "log" ? "|X[k]| (log)" : "|X[k]|"}
              yTicks={magTicks}
              yTickFormat={magTickFormat}
              baselineY={0}
              compact
              xOffset={xOffset}
            />
          </div>
        </div>

        {/* Phase */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-md lg:text-lg text-fg font-serif font-semibold text-center shrink-0">
            Phase {"\u2220"}X[k]
          </div>
          <div className="flex-1 min-h-0">
            <StemPlotCanvas
              data={displayPhases}
              yMin={-Math.PI}
              yMax={Math.PI}
              xLabel="k"
              yLabel={"\u2220X[k] (rad)"}
              yTicks={PI_TICKS}
              yTickFormat={formatPi}
              baselineY={0}
              compact
              xOffset={xOffset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
