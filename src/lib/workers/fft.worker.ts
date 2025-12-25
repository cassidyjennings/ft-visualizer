/// <reference lib="webworker" />

import { fft2dInPlace } from "../fft/fft2d";
import { fftshift2dInPlace } from "../fft/shift";

export type FFTRequest = {
  width: number;
  height: number;
  pixels: Uint8Array; // grayscale 0..255
  shift: boolean;
};

export type FFTResponse = {
  width: number;
  height: number;
  real: Float32Array;
  imag: Float32Array;
};

self.onmessage = (e: MessageEvent<FFTRequest>) => {
  const { width, height, pixels, shift } = e.data;

  const n = width * height;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    // Convert to float in [0, 1]
    real[i] = pixels[i] / 255;
    imag[i] = 0;
  }

  fft2dInPlace(real, imag, width, height, 1);

  if (shift) {
    fftshift2dInPlace(real, imag, width, height);
  }

  const msg: FFTResponse = { width, height, real, imag };

  // Transfer buffers (fast, no copy)
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, [
    real.buffer,
    imag.buffer,
  ]);
};

export {};
