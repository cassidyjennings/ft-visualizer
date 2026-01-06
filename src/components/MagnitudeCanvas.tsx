"use client";

import React, { useEffect, useRef } from "react";
import SpectrumCanvasBase from "@/components/SpectrumCanvasBase";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type MagnitudeCanvasProps = {
  fft: { width: number; height: number; real: Float32Array; imag: Float32Array } | null;
  selectedSize: number;
  px: number;
  scale: "linear" | "log";

  onPointerDownHandle: (key: "mag", e: React.PointerEvent) => void;
  onPointerMoveHandle: (e: React.PointerEvent) => void;
  onPointerUpHandle: () => void;
};

export default function MagnitudeCanvas({
  fft,
  selectedSize,
  px,
  scale,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
}: MagnitudeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fft) return;
    if (fft.width !== selectedSize || fft.height !== selectedSize) return;

    drawMagnitude(
      canvasRef.current,
      fft.real,
      fft.imag,
      selectedSize,
      selectedSize,
      scale,
    );
  }, [fft, selectedSize, scale]);

  return (
    <SpectrumCanvasBase
      label={<>Magnitude ({scale})</>}
      selectedSize={selectedSize}
      px={px}
      dragKey="mag"
      handleTitle="Drag to resize magnitude"
      onPointerDownHandle={onPointerDownHandle}
      onPointerMoveHandle={onPointerMoveHandle}
      onPointerUpHandle={onPointerUpHandle}
      canvas={
        <canvas
          ref={canvasRef}
          width={selectedSize}
          height={selectedSize}
          className="border bg-black block"
          style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
        />
      }
    />
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
    const g = Math.floor(255 * clamp(vals[i] * inv, 0, 1));
    const j = i * 4;
    img.data[j + 0] = g;
    img.data[j + 1] = g;
    img.data[j + 2] = g;
    img.data[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}
