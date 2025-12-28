/// <reference lib="webworker" />

import { fft2dInPlace } from "../fft/fft2d";
import { fftshift2dInPlace } from "../fft/shift";
import type { FFTNormalization } from "@/lib/fft/types";

export type FFTRequest = {
  width: number;
  height: number;
  pixels: Uint8Array; // grayscale 0..255
  shift: boolean;
  normalization: FFTNormalization;
  center: "centerPixel" | "centerBetween" | "topLeft";
};

export type FFTResponse = {
  width: number;
  height: number;
  real: Float32Array;
  imag: Float32Array;
};

// self.onmessage = (e: MessageEvent<FFTRequest>) => {
//   const { width, height, pixels, shift, normalization, center } = e.data;

//   const n = width * height;
//   if (pixels.length !== n) {
//     throw new Error(`pixels length mismatch: got ${pixels.length}, expected ${n}`);
//   }
//   const real = new Float32Array(n);
//   const imag = new Float32Array(n);

//   for (let i = 0; i < n; i++) {
//     // Convert to float in [0, 1]
//     real[i] = pixels[i] / 255;
//     imag[i] = 0;
//   }

//   // Forward FFT
//   fft2dInPlace(real, imag, width, height, 1, normalization);

//   if (shift) {
//     fftshift2dInPlace(real, imag, width, height);
//   }

//   const msg: FFTResponse = { width, height, real, imag };

//   // Transfer buffers (fast, no copy)
//   (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, [
//     real.buffer,
//     imag.buffer,
//   ]);
// };

// export {};

self.onmessage = (e: MessageEvent<FFTRequest>) => {
  const { width, height, pixels, shift, normalization, center } = e.data;

  const n = width * height;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    real[i] = pixels[i] / 255;
    imag[i] = 0;
  }

  // ---- Apply spatial-origin convention BEFORE FFT ----
  if (center === "centerPixel" || center === "centerBetween") {
    // Move array center to index (0,0) so "center" behaves like spatial origin.
    // For even sizes, this is the same as an ifftshift/fftshift swap.
    fftshift2dInPlace(real, imag, width, height);
  }

  // ---- Forward FFT ----
  fft2dInPlace(real, imag, width, height, 1, normalization);

  // ---- Extra correction for "centerBetween" (half-sample origin shift) ----
  if (center === "centerBetween") {
    applyHalfSampleOriginCorrectionInFreq(real, imag, width, height);
  }

  // ---- Shift spectrum for DISPLAY (DC centered) ----
  if (shift) {
    fftshift2dInPlace(real, imag, width, height);
  }

  const msg: FFTResponse = { width, height, real, imag };
  (self as DedicatedWorkerGlobalScope).postMessage(msg, [real.buffer, imag.buffer]);
};

function applyHalfSampleOriginCorrectionInFreq(
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
) {
  // Multiply each frequency bin (u,v) by exp(-i2π( u*(0.5/width) + v*(0.5/height) ))
  // This corresponds to shifting the spatial origin by -0.5 in each axis.
  for (let v = 0; v < height; v++) {
    const phY = (-2 * Math.PI * (0.5 * v)) / height;
    for (let u = 0; u < width; u++) {
      const ph = phY + (-2 * Math.PI * (0.5 * u)) / width;
      const c = Math.cos(ph);
      const s = Math.sin(ph);

      const idx = v * width + u;
      const r = real[idx];
      const im = imag[idx];

      // (r + i im) * (c + i s)
      real[idx] = r * c - im * s;
      imag[idx] = r * s + im * c;
    }
  }
}
