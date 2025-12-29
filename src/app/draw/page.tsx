"use client";

import { useEffect, useRef, useState } from "react";
import CanvasGrid, { CanvasGridHandle } from "@/components/CanvasGrid";
import CanvasGridControls from "@/components/CanvasGridControls";
import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import type { BrushSettings } from "@/lib/image/brush";
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

  // Display controls
  const [size, setSize] = useState(64);
  const [showGrid, setShowGrid] = useState(true);
  const [brush, setBrush] = useState<BrushSettings>({
    value: 255,
    radius: 0,
    mode: "draw",
    shape: "square",
  });

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

  // Perform FFT on button click
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
      center: settings.center,
    };

    // Transfer pixels buffer to worker for speed
    w.postMessage(msg, [pixels.buffer]);
  }

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
            showGrid={showGrid}
            initialDisplaySize={512}
            minDisplaySize={160}
          />

          {/* Drawing controls (stacked under canvas) */}
          <div className="mt-6 max-w-140">
            <CanvasGridControls
              gridRef={canvasRef}
              size={size}
              setSize={setSize}
              brush={brush}
              setBrush={setBrush}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
            />
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
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
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
