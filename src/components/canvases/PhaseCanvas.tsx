"use client";

import React, { useEffect, useRef } from "react";
import SpectrumCanvasBase from "@/components/canvases/SpectrumCanvasBase";

type PhaseCanvasProps = {
  fft: { width: number; height: number; real: Float32Array; imag: Float32Array } | null;
  selectedSize: number;
  px: number;

  onPointerDownHandle: (key: "phase", e: React.PointerEvent) => void;
  onPointerMoveHandle: (e: React.PointerEvent) => void;
  onPointerUpHandle: () => void;
};

export default function PhaseCanvas({
  fft,
  selectedSize,
  px,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
}: PhaseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fft) return;
    if (fft.width !== selectedSize || fft.height !== selectedSize) return;

    drawPhase(canvasRef.current, fft.real, fft.imag, selectedSize, selectedSize);
  }, [fft, selectedSize]);

  return (
    <SpectrumCanvasBase
      label="Phase"
      selectedSize={selectedSize}
      px={px}
      dragKey="phase"
      handleTitle="Drag to resize phase"
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
    if (imag[pix_i] ** 2 + real[pix_i] ** 2 === 0) {
      const j = pix_i * 4;
      img.data[j + 0] = 128;
      img.data[j + 1] = 128;
      img.data[j + 2] = 128;
      img.data[j + 3] = 255;
    } else {
      const phi = Math.atan2(imag[pix_i], real[pix_i]);
      const t = Math.abs(phi) / Math.PI;

      let r = 0;
      let g = 0;
      let b = 0;

      if (phi > 0) r = Math.round(255 * t);
      else if (phi < 0) b = Math.round(255 * t);

      if (t > 0.999) {
        r = 255;
        g = 255;
        b = 255;
      }

      const j = pix_i * 4;
      img.data[j + 0] = r;
      img.data[j + 1] = g;
      img.data[j + 2] = b;
      img.data[j + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
}
