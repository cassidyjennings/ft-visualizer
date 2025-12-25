/**
 * Radix-2 Cooley–Tukey FFT (in-place), normalization handled elsewhere.
 * @param real r=Real array
 * @param imag Imaginary array
 * @param dir DFT direction. +1 for forward DFT, -1 for inverse DFT
 */
export function fft1dInPlace(real: Float32Array, imag: Float32Array, dir: 1 | -1): void {
  const n = real.length;
  if (n !== imag.length) throw new Error("real/imag length mismatch");
  if ((n & (n - 1)) !== 0) throw new Error("FFT length must be power of two");

  bitReversePermutationInPlace(real, imag);

  for (let len = 2; len <= n; len <<= 1) {
    // Each iteration doubles size of DFT being computed
    const half = len >> 1;

    // Basis function: omegaLen = exp(+/-2πi / len) = omegaLenR + j*omegaLenI
    const theta = (dir * -2 * Math.PI) / len;
    const omegaLenR = Math.cos(theta);
    const omegaLenI = Math.sin(theta);

    for (let start = 0; start < n; start += len) {
      // Initial complex roots of unity
      let omegaR = 1;
      let omegaI = 0;

      for (let k = 0; k < half; k++) {
        const i0 = start + k; // even part
        const i1 = i0 + half; // odd part

        // Cache the even value
        const uR = real[i0];
        const uI = imag[i0];

        // Multiply the odd value by the current complex root of unity
        const vR = real[i1] * omegaR - imag[i1] * omegaI;
        const vI = real[i1] * omegaI + imag[i1] * omegaR;

        // Danielson–Lanczos butterfly combination:
        // X[k]       = u + v
        // X[k+L/2]   = u - v
        real[i0] = uR + vR;
        imag[i0] = uI + vI;
        real[i1] = uR - vR;
        imag[i1] = uI - vI;

        // Move to next complex roots of unity via omega *= omegaLen
        const nextOmegaR = omegaR * omegaLenR - omegaI * omegaLenI;
        const nextOmegaI = omegaR * omegaLenI + omegaI * omegaLenR;
        omegaR = nextOmegaR;
        omegaI = nextOmegaI;
      }
    }
  }
}

/**
 * Reorder the input arrays into bit-reversed order (in-place).
 *
 * This permutation is required for the in-place Cooley–Tukey FFT.
 * After this step, FFT butterfly operations can be applied locally
 * and sequentially in memory.
 *
 * Invariant:
 *   At the start of iteration i, `j` equals bitReverse(i).
 *
 * Strategy:
 *   - Walk i forward in normal order: 0, 1, 2, ...
 *   - Maintain j as the bit-reversed version of i
 *   - Swap elements only when i < j to avoid double-swapping
 *   - Update j incrementally to bitReverse(i + 1) using
 *     binary carry logic on reversed bits
 * @param real real array
 * @param imag imaginary array
 */
function bitReversePermutationInPlace(real: Float32Array, imag: Float32Array): void {
  const n = real.length;

  let j = 0; // bit-reversed index of i

  for (let i = 0; i < n; i++) {
    // Swap only once per permutation pair
    if (i < j) {
      // Swap real parts
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;

      // Swap imaginary parts
      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }

    // Compute next bit-reversed index: j = bitReverse(i + 1)
    let m = n >> 1; // start at highest bit
    while (m >= 1 && j >= m) {
      j -= m; // clear bit (1 -> 0) and carry
      m >>= 1; // move to next lower bit
    }
    j += m; // set first zero bit (0 -> 1)
  }
}
