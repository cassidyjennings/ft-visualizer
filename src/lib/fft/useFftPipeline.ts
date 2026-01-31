// "use client";

// import { useEffect, useRef, useState } from "react";
// import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
// import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
// import {
//   drawMagnitude,
//   drawPhase,
//   fillCanvas,
//   type FFTState,
//   type MagnitudeStats,
// } from "@/lib/fft/draw";
// import type { MagScale } from "@/lib/settings/types";

// export type GridLikeHandle = {
//   getImageData: () => Uint8Array;
// };

// export type FftPipelineSettings = {
//   shift: "shifted" | "unshifted";
//   normalization: FFTRequest["normalization"];
//   center: FFTRequest["center"];
//   magScale: MagScale;
// };

// type UseFftPipelineArgs = {
//   selectedSize: number;
//   isDark: boolean;
//   settings: FftPipelineSettings;

//   gridRef: React.RefObject<GridLikeHandle | null>;
//   phaseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
//   magCanvasRef: React.RefObject<HTMLCanvasElement | null>;

//   phaseEmpty: string;
//   magEmpty: string;

//   canonicalizePixels?: (pixels: Uint8Array, isDark: boolean) => Uint8Array;
// };

// type UseFftPipelineResult = {
//   fft: FFTState | null;
//   isTransforming: boolean;

//   transform: () => void;
//   recompute: () => void;
//   clearSpectra: () => void;
// };

// export function useFftPipeline({
//   selectedSize,
//   isDark,
//   settings,
//   gridRef,
//   phaseCanvasRef,
//   magCanvasRef,
//   phaseEmpty,
//   magEmpty,
//   canonicalizePixels,
// }: UseFftPipelineArgs): UseFftPipelineResult {
//   const workerRef = useRef<Worker | null>(null);

//   const [fft, setFft] = useState<FFTState | null>(null);
//   const [isTransforming, setIsTransforming] = useState(false);
//   const [magStats, setMagStats] = useState<MagnitudeStats | null>(null);

//   function clearSpectra() {
//     fillCanvas(phaseCanvasRef.current, selectedSize, selectedSize, phaseEmpty);
//     fillCanvas(magCanvasRef.current, selectedSize, selectedSize, magEmpty);
//   }

//   function post(markTransforming: boolean) {
//     const worker = workerRef.current;
//     const grid = gridRef.current;
//     if (!worker || !grid) return;

//     if (markTransforming) setIsTransforming(true);

//     const raw = grid.getImageData();
//     const pixels = canonicalizePixels ? canonicalizePixels(raw, isDark) : raw;

//     const req: FFTRequest = {
//       width: selectedSize,
//       height: selectedSize,
//       pixels,
//       shift: settings.shift === "shifted",
//       normalization: settings.normalization,
//       center: settings.center,
//     };

//     worker.postMessage(req, [pixels.buffer]);
//   }

//   function transform() {
//     post(true);
//   }

//   function recompute() {
//     post(false);
//   }

//   // Worker lifecycle
//   useEffect(() => {
//     const w = makeFFTWorker();
//     workerRef.current = w;

//     w.onmessage = (e: MessageEvent<FFTResponse>) => {
//       setFft({
//         width: e.data.width,
//         height: e.data.height,
//         real: e.data.real,
//         imag: e.data.imag,
//       });
//       setIsTransforming(false);
//     };

//     return () => {
//       w.terminate();
//       workerRef.current = null;
//     };
//   }, []);

//   // Size change: paint empties immediately, then recompute (no spinner)
//   useEffect(() => {
//     const worker = workerRef.current;
//     const grid = gridRef.current;

//     clearSpectra();

//     if (!worker || !grid) return;

//     requestAnimationFrame(() => {
//       post(false);
//     });
//     // Intentionally minimal deps; selectedSize/empties are the real triggers.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedSize, phaseEmpty, magEmpty]);

//   // FFT paint
//   useEffect(() => {
//     if (!fft) {
//       clearSpectra();
//       return;
//     }

//     if (fft.width !== selectedSize || fft.height !== selectedSize) {
//       clearSpectra();
//       return;
//     }

//     drawPhase(phaseCanvasRef.current, fft.real, fft.imag, selectedSize, selectedSize);
//     const stats = drawMagnitude(
//       magCanvasRef.current,
//       fft.real,
//       fft.imag,
//       fft.width,
//       fft.height,
//       magScale, // "linear" | "log"
//       magNormalize, // "max" | "none"
//       isDark,
//     );
//     setMagStats(stats);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fft, selectedSize, settings.magScale, isDark, phaseEmpty, magEmpty]);

//   return { fft, isTransforming, transform, recompute, clearSpectra };
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import {
  drawMagnitude,
  drawPhase,
  fillCanvas,
  type FFTState,
  type MagnitudeStats,
  type MagNorm,
} from "@/lib/fft/draw";
import type { MagScale } from "@/lib/settings/types";

export type GridLikeHandle = {
  getImageData: () => Uint8Array;
};

export type FftPipelineSettings = {
  shift: "shifted" | "unshifted";
  normalization: FFTRequest["normalization"];
  center: FFTRequest["center"];

  magScale: MagScale;
  magNormalize: MagNorm; // "max" | "none"
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

  magStats: MagnitudeStats | null;

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
  const [magStats, setMagStats] = useState<MagnitudeStats | null>(null);

  function clearSpectra() {
    fillCanvas(phaseCanvasRef.current, selectedSize, selectedSize, phaseEmpty);
    fillCanvas(magCanvasRef.current, selectedSize, selectedSize, magEmpty);
    setMagStats(null);
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

  // Size change: paint empties immediately, then recompute
  useEffect(() => {
    clearSpectra();

    const worker = workerRef.current;
    const grid = gridRef.current;
    if (!worker || !grid) return;

    requestAnimationFrame(() => {
      post(false);
    });
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

    const stats = drawMagnitude(
      magCanvasRef.current,
      fft.real,
      fft.imag,
      fft.width,
      fft.height,
      settings.magScale, // "linear" | "log"
      settings.magNormalize, // "max" | "none"
      isDark,
    );

    setMagStats(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fft,
    selectedSize,
    settings.magScale,
    settings.magNormalize,
    isDark,
    phaseEmpty,
    magEmpty,
  ]);

  return { fft, isTransforming, magStats, transform, recompute, clearSpectra };
}
