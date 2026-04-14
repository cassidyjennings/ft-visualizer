"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import TransformButton from "@/components/ui/TransformButton";
import StemPlotCanvas from "@/components/dft1d/StemPlotCanvas";
import SignalControls from "@/components/dft1d/SignalControls";
import { dft } from "@/lib/fft/dft";

type PresetType = "zero" | "sine" | "cosine" | "square";

const PI_TICKS = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI];

function formatPi(v: number): string {
  if (Math.abs(v - Math.PI) < 0.01) return "\u03C0";
  if (Math.abs(v + Math.PI) < 0.01) return "-\u03C0";
  if (Math.abs(v - Math.PI / 2) < 0.01) return "\u03C0/2";
  if (Math.abs(v + Math.PI / 2) < 0.01) return "-\u03C0/2";
  return "0";
}

export default function Axis1DPage() {
  const { settings } = useSettings();

  const [N, setN] = useState(16);
  const [period, setPeriod] = useState(8);
  const [samples, setSamples] = useState<number[]>(() => new Array(16).fill(0));
  const [hasTransformed, setHasTransformed] = useState(false);
  const [dftResult, setDftResult] = useState<{
    real: Float32Array;
    imag: Float32Array;
  } | null>(null);

  // Undo history
  const [history, setHistory] = useState<number[][]>([]);
  const samplesRef = useRef(samples);
  samplesRef.current = samples;

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), [...samplesRef.current]]);
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setSamples(last);
      return prev.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    pushHistory();
    setSamples((prev) => new Array(prev.length).fill(0));
  }, [pushHistory]);

  // Handle N change — preserve existing values, new stems default to 0
  const handleNChange = useCallback(
    (newN: number) => {
      setN(newN);
      setSamples((prev) => {
        const next = new Array(newN).fill(0);
        for (let i = 0; i < Math.min(prev.length, newN); i++) {
          next[i] = prev[i];
        }
        return next;
      });
      if (period > newN) setPeriod(newN);
    },
    [period],
  );

  // Handle individual stem drag — push history on drag start
  const isDragging = useRef(false);
  const handleDrag = useCallback(
    (index: number, value: number) => {
      if (!isDragging.current) {
        isDragging.current = true;
        pushHistory();
      }
      setSamples((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    [pushHistory],
  );

  // Reset drag flag on pointer up (globally)
  useEffect(() => {
    const up = () => {
      isDragging.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  // Apply preset function using current N and period
  const applyPreset = useCallback(
    (type: PresetType) => {
      pushHistory();
      const newSamples = new Array(N).fill(0);
      if (type !== "zero") {
        for (let n = 0; n < N; n++) {
          const angle = (2 * Math.PI * n) / period;
          switch (type) {
            case "sine":
              newSamples[n] = Math.sin(angle);
              break;
            case "cosine":
              newSamples[n] = Math.cos(angle);
              break;
            case "square":
              newSamples[n] = Math.sign(Math.sin(angle));
              break;
          }
        }
      }
      setSamples(newSamples);
    },
    [N, period, pushHistory],
  );

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

  return (
    <div
      className="w-full flex items-stretch gap-8 min-h-0 px-4 sm:px-6 lg:px-10"
      style={{ height: "calc(100svh - 9rem)" }}
    >
      {/* =================== LEFT: Input Signal + Controls =================== */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2">
        <div className="text-md lg:text-lg text-fg font-serif font-semibold text-center w-full shrink-0">
          Input Signal x[n]
        </div>
        <div className="flex-1 min-h-0">
          <StemPlotCanvas
            data={samples}
            yMin={-1}
            yMax={1}
            xLabel="n"
            yLabel="x[n]"
            interactive
            onDrag={handleDrag}
            yTicks={[-1, -0.5, 0, 0.5, 1]}
            baselineY={0}
          />
        </div>
        <div className="shrink-0">
          <SignalControls
            N={N}
            onNChange={handleNChange}
            period={period}
            onPeriodChange={setPeriod}
            onPreset={applyPreset}
            onUndo={handleUndo}
            onClear={handleClear}
          />
        </div>
      </div>

      {/* =================== CENTER: Transform Arrow =================== */}
      <div className="shrink-0 flex flex-col items-center justify-center">
        {/* Top spacer matches bottom text height for true vertical centering */}
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
              data={magnitudes}
              yMin={0}
              yMax={magYMax}
              xLabel="k"
              yLabel={settings.magScale === "log" ? "|X[k]| (log)" : "|X[k]|"}
              yTicks={magTicks}
              yTickFormat={magTickFormat}
              baselineY={0}
              compact
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
              data={phases}
              yMin={-Math.PI}
              yMax={Math.PI}
              xLabel="k"
              yLabel={"\u2220X[k] (rad)"}
              yTicks={PI_TICKS}
              yTickFormat={formatPi}
              baselineY={0}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
