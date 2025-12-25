"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
import type { FFTResponse } from "@/lib/workers/fft.worker";
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
type MagScale = "linear" | "log";

export default function SpectrumPage() {
  // TEMP: for now we’ll just use a built-in test image until we wire it from DrawPage
  // Next step will be: pass pixels via URL state or a shared store.
  const [size, setSize] = useState(64);
  const [shift, setShift] = useState(true);

  const [real, setReal] = useState<Float32Array | null>(null);
  const [imag, setImag] = useState<Float32Array | null>(null);

  const magCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [magScale, setMagScale] = useState<MagScale>("linear");
  const phaseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simple test pattern: a centered square
  const pixels = useMemo(() => {
    const p = new Uint8Array(size * size);
    const r0 = Math.floor(size * 0.35);
    const r1 = Math.floor(size * 0.65);
    for (let y = r0; y < r1; y++) {
      for (let x = r0; x < r1; x++) {
        p[y * size + x] = 255;
      }
    }
    return p;
  }, [size]);

  useEffect(() => {
    const worker = makeFFTWorker();

    worker.onmessage = (e: MessageEvent<FFTResponse>) => {
      setReal(new Float32Array(e.data.real));
      setImag(new Float32Array(e.data.imag));
    };

    worker.postMessage({ width: size, height: size, pixels, shift });

    return () => worker.terminate();
  }, [size, pixels, shift]);

  useEffect(() => {
    if (!real || !imag) return;

    drawMagnitude(magCanvasRef.current, real, imag, size, size, magScale);
    drawPhase(phaseCanvasRef.current, real, imag, size, size);
  }, [real, imag, size, magScale]);

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Fourier Spectrum</h1>

      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2">
          Size
          <select
            className="border p-1"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {[32, 64, 128, 256].map((s) => (
              <option key={s} value={s}>
                {s} × {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          Magnitude scale
          <select
            className="border p-1"
            value={magScale}
            onChange={(e) => setMagScale(e.target.value as MagScale)}
          >
            <option value="linear">Linear</option>
            <option value="log">Log</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          Shift (DC centered)
          <input
            type="checkbox"
            checked={shift}
            onChange={(e) => setShift(e.target.checked)}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 font-medium">Magnitude ({magScale})</div>
          <canvas
            ref={magCanvasRef}
            width={size}
            height={size}
            className="border"
            style={{ width: 512, height: 512, imageRendering: "pixelated" }}
          />
        </div>

        <div>
          <div className="mb-2 font-medium">Phase</div>
          <canvas
            ref={phaseCanvasRef}
            width={size}
            height={size}
            className="border"
            style={{ width: 512, height: 512, imageRendering: "pixelated" }}
          />
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

  // compute magnitude + find max (after chosen scaling)
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

  for (let i = 0; i < width * height; i++) {
    const ph = Math.atan2(imag[i], real[i]); // [-pi, pi]
    // map phase to grayscale (simple). Later we can do hue mapping.
    const g = Math.floor(((ph + Math.PI) / (2 * Math.PI)) * 255);
    const j = i * 4;
    img.data[j + 0] = g;
    img.data[j + 1] = g;
    img.data[j + 2] = g;
    img.data[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}
