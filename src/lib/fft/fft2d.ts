import { fft1dInPlace } from "./fft1d";

/**
 * In-place 2D FFT on (width x height) stored row-major in real/imag.
 * @param real Real array
 * @param imag Imaginary array
 * @param width Image width
 * @param height Image height
 * @param dir DFT direction. +1 for forward DFT, -1 for inverse DFT
 */
export function fft2dInPlace(
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
  dir: 1 | -1,
): void {
  if (real.length !== width * height || imag.length !== width * height) {
    throw new Error("Array size mismatch");
  }
  if ((width & (width - 1)) !== 0 || (height & (height - 1)) !== 0) {
    throw new Error("Width/height must be powers of two");
  }

  // FFT rows
  const rowR = new Float32Array(width);
  const rowI = new Float32Array(width);
  for (let y = 0; y < height; y++) {
    // Build array of this row
    const base = y * width;
    for (let x = 0; x < width; x++) {
      rowR[x] = real[base + x];
      rowI[x] = imag[base + x];
    }
    // Compute DFT of row
    fft1dInPlace(rowR, rowI, dir);
    // Record result in-place
    for (let x = 0; x < width; x++) {
      real[base + x] = rowR[x];
      imag[base + x] = rowI[x];
    }
  }

  // FFT columns
  const colR = new Float32Array(height);
  const colI = new Float32Array(height);
  for (let x = 0; x < width; x++) {
    // Build array of this column
    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      colR[y] = real[idx];
      colI[y] = imag[idx];
    }
    // Compute DFT of column
    fft1dInPlace(colR, colI, dir);
    // Record result in place
    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      real[idx] = colR[y];
      imag[idx] = colI[y];
    }
  }

  // Normalize on forward
  if (dir === 1) {
    const scale = 1 / (width * height);
    for (let i = 0; i < real.length; i++) {
      real[i] *= scale;
      imag[i] *= scale;
    }
  }
}
