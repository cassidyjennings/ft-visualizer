"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import CanvasGrid, { CanvasGridHandle } from "@/components/CanvasGrid";
import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import type { BrushMode, BrushShape, BrushSettings } from "@/lib/image/brush";
import { useSettings } from "@/lib/settings/SettingsContext";

type FFTState = {
  width: number;
  height: number;
  real: Float32Array;
  imag: Float32Array;
} | null;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function DrawPage() {
  // Canvas ref
  const canvasRef = useRef<CanvasGridHandle | null>(null);

  // Worker
  const workerRef = useRef<Worker | null>(null);

  // Spectrum canvases
  const magCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Size + brush controls
  const [size, setSize] = useState(64);
  const [value, setValue] = useState(255);
  const [radius, setRadius] = useState(0);
  const [mode, setMode] = useState<BrushMode>("draw");
  const [shape, setShape] = useState<BrushShape>("square");

  const brush: BrushSettings = useMemo(
    () => ({ value, radius, mode, shape }),
    [value, radius, mode, shape],
  );

  // FFT display options
  const { settings } = useSettings();

  // FFT outputs
  const [fft, setFft] = useState<FFTState>(null);

  // "busy" UI
  const [isTransforming, setIsTransforming] = useState(false);

  // Initialize worker on first render
  useEffect(() => {
    const w = makeFFTWorker();
    workerRef.current = w;

    w.onmessage = (e: MessageEvent<FFTResponse>) => {
      setFft({
        width: e.data.width,
        height: e.data.height,
        real: e.data.real,
        imag: e.data.imag,
      });
      setIsTransforming(false);
    };

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // Draw spectrum whenever FFT output or display options change
  useEffect(() => {
    if (!fft) return;
    if (fft.width !== size || fft.height !== size) return; // ignore stale FFT

    drawMagnitude(
      magCanvasRef.current,
      fft.real,
      fft.imag,
      size,
      size,
      settings.magScale,
    );
    drawPhase(phaseCanvasRef.current, fft.real, fft.imag, size, size);
  }, [fft, size, settings.magScale]);

  function handleTransform() {
    const w = workerRef.current;
    const grid = canvasRef.current;
    if (!w || !grid) return;

    setIsTransforming(true);

    const pixels = grid.getImageData(); // Uint8Array length size*size

    const msg: FFTRequest = {
      width: size,
      height: size,
      pixels,
      shift: settings.shift === "shifted",
      normalization: settings.normalization,
    };

    // Transfer pixels buffer to worker for speed
    w.postMessage(msg, [pixels.buffer]);
  }

  // Ctrl/Cmd+Z undo
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndo) return;
      e.preventDefault();
      canvasRef.current?.undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Draw → Fourier Transform</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] items-start">
        {/* LEFT: Canvas + drawing controls */}
        <div className="min-w-0">
          <CanvasGrid
            ref={canvasRef}
            width={size}
            height={size}
            brush={brush}
            initialDisplaySize={512}
            minDisplaySize={160}
          />

          {/* Drawing controls (stacked under canvas) */}
          <div className="mt-6 max-w-140">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
              {/* Size + Undo/Clear */}
              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Size</span>
                  <select
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="border rounded p-2"
                  >
                    {[2, 4, 8, 16, 32, 64, 128, 256].map((s) => (
                      <option key={s} value={s}>
                        {s} × {s}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-2">
                  <button
                    className="border rounded px-3 py-2"
                    onClick={() => canvasRef.current?.undo()}
                  >
                    Undo
                  </button>
                  <button
                    className="border rounded px-3 py-2"
                    onClick={() => canvasRef.current?.clear()}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grayscale</span>
                    <span className="text-sm tabular-nums">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Radius</span>
                    <span className="text-sm tabular-nums">{radius}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                  />
                </label>
              </div>

              {/* Mode + Shape */}
              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Mode</span>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as BrushMode)}
                    className="border rounded p-2"
                  >
                    <option value="draw">Draw</option>
                    <option value="erase">Erase</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Shape</span>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value as BrushShape)}
                    className="border rounded p-2"
                  >
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="diamond">Diamond</option>
                    <option value="cross">Cross</option>
                    <option value="hline">Horizontal line</option>
                    <option value="vline">Vertical line</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: Transform button centered */}
        <div className="flex justify-center lg:pt-10">
          <button
            onClick={handleTransform}
            disabled={isTransforming}
            className="border rounded px-4 py-3 font-medium disabled:opacity-50 whitespace-nowrap"
            title="Compute DFT magnitude + phase"
          >
            {isTransforming ? "Transforming…" : "Transform →"}
          </button>
        </div>

        {/* RIGHT: Magnitude + Phase side-by-side, controls underneath */}
        <div className="min-w-0">
          {/* Two equal canvases */}
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <div className="mb-2 font-medium">Magnitude ({settings.magScale})</div>
              <canvas
                ref={magCanvasRef}
                width={size}
                height={size}
                className="border w-full aspect-square"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-2 font-medium">Phase</div>
              <canvas
                ref={phaseCanvasRef}
                width={size}
                height={size}
                className="border w-full aspect-square"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
          DFT display controls under both
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {/* <label className="flex items-center gap-2">
              Shift
              <input
                type="checkbox"
                checked={shift}
                onChange={(e) => setShift(e.target.checked)}
              />
            </label>

            <label className="flex items-center gap-2">
              Magnitude
              <select
                className="border p-1"
                value={magScale}
                onChange={(e) => setMagScale(e.target.value as MagScale)}
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
              </select>
            </label> */}

            {!fft && (
              <span className="text-gray-600">
                Click <span className="font-medium">Transform →</span> to compute the DFT.
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function drawMagnitude(
  canvas: HTMLCanvasElement | null,
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
  scale: "linear" | "log",
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = ctx.createImageData(width, height);

  let maxV = 0;
  const vals = new Float32Array(width * height);

  for (let i = 0; i < vals.length; i++) {
    const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    const v = scale === "log" ? Math.log1p(mag) : mag;
    vals[i] = v;
    if (v > maxV) maxV = v;
  }

  const inv = maxV > 0 ? 1 / maxV : 1;

  for (let i = 0; i < vals.length; i++) {
    const g = Math.floor(255 * clamp01(vals[i] * inv));
    const j = i * 4;
    img.data[j + 0] = g;
    img.data[j + 1] = g;
    img.data[j + 2] = g;
    img.data[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}

function drawPhase(
  canvas: HTMLCanvasElement | null,
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = ctx.createImageData(width, height);

  for (let pix_i = 0; pix_i < width * height; pix_i++) {
    const phi = Math.atan2(imag[pix_i], real[pix_i]); // [-pi, pi]
    const t = Math.abs(phi) / Math.PI; // [0, 1]

    let r = 0;
    let g = 0;
    let b = 0;

    if (phi > 0) {
      // Positive phase -> red
      r = Math.round(255 * t);
    } else if (phi < 0) {
      b = Math.round(255 * t);
    }

    // White at pi and -pi
    if (t > 0.999) {
      r = 255;
      g = 255;
      b = 255;
    }

    // Each pixel has 4 consecutive entries in img.data
    const pix_start = pix_i * 4;
    img.data[pix_start + 0] = r; // R entry
    img.data[pix_start + 1] = g; // G entry
    img.data[pix_start + 2] = b; // B entry
    img.data[pix_start + 3] = 255; // A entry
  }

  ctx.putImageData(img, 0, 0);
}
