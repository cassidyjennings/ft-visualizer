"use client";

import { useEffect, useRef, useState } from "react";
import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import { drawMagnitude, drawPhase, fillCanvas, type FFTState } from "@/lib/fft/draw";
import type { MagScale } from "@/lib/settings/types";

/**
 * Keep the hook independent of UI components:
 * we only need a grid that can give us image data.
 */
export type GridLikeHandle = {
  getImageData: () => Uint8Array;
};

export type FftPipelineSettings = {
  shift: "shifted" | "unshifted";
  normalization: FFTRequest["normalization"];
  center: FFTRequest["center"];
  magScale: MagScale;
};

type UseFftPipelineArgs = {
  selectedSize: number;
  isDark: boolean;
  settings: FftPipelineSettings;

  gridRef: React.RefObject<GridLikeHandle | null>;
  phaseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  magCanvasRef: React.RefObject<HTMLCanvasElement | null>;

  phaseEmpty: string;
  magEmpty: string;

  canonicalizePixels?: (pixels: Uint8Array, isDark: boolean) => Uint8Array;
};

type UseFftPipelineResult = {
  fft: FFTState | null;
  isTransforming: boolean;

  transform: () => void;
  recompute: () => void;
  clearSpectra: () => void;
};

export function useFftPipeline({
  selectedSize,
  isDark,
  settings,
  gridRef,
  phaseCanvasRef,
  magCanvasRef,
  phaseEmpty,
  magEmpty,
  canonicalizePixels,
}: UseFftPipelineArgs): UseFftPipelineResult {
  const workerRef = useRef<Worker | null>(null);

  const [fft, setFft] = useState<FFTState | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  function clearSpectra() {
    fillCanvas(phaseCanvasRef.current, selectedSize, selectedSize, phaseEmpty);
    fillCanvas(magCanvasRef.current, selectedSize, selectedSize, magEmpty);
  }

  function post(markTransforming: boolean) {
    const worker = workerRef.current;
    const grid = gridRef.current;
    if (!worker || !grid) return;

    if (markTransforming) setIsTransforming(true);

    const raw = grid.getImageData();
    const pixels = canonicalizePixels ? canonicalizePixels(raw, isDark) : raw;

    const req: FFTRequest = {
      width: selectedSize,
      height: selectedSize,
      pixels,
      shift: settings.shift === "shifted",
      normalization: settings.normalization,
      center: settings.center,
    };

    worker.postMessage(req, [pixels.buffer]);
  }

  function transform() {
    post(true);
  }

  function recompute() {
    post(false);
  }

  // Worker lifecycle
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

  // Size change: paint empties immediately, then recompute (no spinner)
  useEffect(() => {
    const worker = workerRef.current;
    const grid = gridRef.current;

    clearSpectra();

    if (!worker || !grid) return;

    requestAnimationFrame(() => {
      post(false);
    });
    // Intentionally minimal deps; selectedSize/empties are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize, phaseEmpty, magEmpty]);

  // FFT paint
  useEffect(() => {
    if (!fft) {
      clearSpectra();
      return;
    }

    if (fft.width !== selectedSize || fft.height !== selectedSize) {
      clearSpectra();
      return;
    }

    drawPhase(phaseCanvasRef.current, fft.real, fft.imag, selectedSize, selectedSize);
    drawMagnitude(
      magCanvasRef.current,
      fft.real,
      fft.imag,
      selectedSize,
      selectedSize,
      settings.magScale, // safe if your drawMagnitude expects MagScale
      isDark,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fft, selectedSize, settings.magScale, isDark, phaseEmpty, magEmpty]);

  return { fft, isTransforming, transform, recompute, clearSpectra };
}
