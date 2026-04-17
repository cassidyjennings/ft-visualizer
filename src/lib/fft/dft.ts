import type { FFTNormalization } from "./types";

/**
 * Naive O(N^2) Discrete Fourier Transform for arbitrary N.
 * X[k] = sum_{n=0}^{N-1} x[n] * exp(-2pi*i*k*n / N)
 */
export function dft(
  input: number[],
  normalization: FFTNormalization = "none",
): { real: Float32Array; imag: Float32Array } {
  const N = input.length;
  const real = new Float32Array(N);
  const imag = new Float32Array(N);

  for (let k = 0; k < N; k++) {
    let sumR = 0;
    let sumI = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      sumR += input[n] * Math.cos(angle);
      sumI -= input[n] * Math.sin(angle);
    }
    real[k] = sumR;
    imag[k] = sumI;
  }

  let scale = 1;
  if (normalization === "forward") scale = 1 / N;
  else if (normalization === "unitary") scale = 1 / Math.sqrt(N);

  if (scale !== 1) {
    for (let k = 0; k < N; k++) {
      real[k] *= scale;
      imag[k] *= scale;
    }
  }

  return { real, imag };
}
