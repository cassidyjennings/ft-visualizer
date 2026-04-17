# Fourier Transform Visualizer – Conventions

## Image Sizes (2D Grid)

Allowed sizes:

- 2 × 2
- 4 × 4
- 8 × 8
- 16 × 16
- 32 × 32
- 64 × 64

(Powers of two only — required by the Cooley-Tukey FFT algorithm.)

## Image Representation

- Grayscale image
- Stored as `Uint8Array`
- Length = `width * height`
- Values in range `[0, 255]`
- Normalized to `[0.0, 1.0]` (divided by 255) before the FFT

## 1D Signal Representation

- Discrete signal `x[n]` stored as a plain `number[]`
- Length = N (configurable, need not be a power of two)
- Values are real-valued (no constraint on range)
- The 1D tool uses a naive O(N²) DFT rather than the Cooley-Tukey FFT

## FFT Representation

- Real and imaginary parts stored separately
- Type: `Float32Array`
- Same length as input signal / image

## Spatial-Origin Convention (2D)

Three options, selectable in Settings:

- **Center pixel (bottom-right)** — the pixel at `(floor(W/2), floor(H/2))` is treated as the spatial origin. An `ifftshift` is applied to the pixel array before the FFT.
- **Between center pixels** — origin sits at the intersection of the four center pixels. Same pre-shift as above, plus a per-bin half-sample phase correction in the frequency domain.
- **Top-left pixel** — the pixel at `(0, 0)` is the spatial origin; no pre-shift is applied.

Default: **Center pixel**.

## Axis-Origin Convention (1D)

Two options, selectable in Settings:

- **Left** — index `n = 0` appears at the left edge of the stem plot.
- **Center** — index `n = 0` appears at the center of the stem plot; an fftshift is applied to output bins for display.

Default: **Left**.

## Visualization Defaults

- Magnitude displayed as: `sqrt(re² + im²)` (linear), optionally `log10(1 + |X|)` (log scale)
- Spectrum is **shifted by default** — DC (zero-frequency) is centered in the display
- Magnitude is **max-normalized by default** — divided by the peak bin value for display
- Phase displayed as `atan2(im, re)` in radians, range `[−π, π]`

## Normalization

Four modes, selectable in Settings:

| Mode | Forward scale | Inverse scale |
|---|---|---|
| None | 1 | 1 |
| Forward (1/N) | 1/N | 1 |
| Inverse (1/N) | 1 | 1/N |
| Unitary | 1/√N | 1/√N |

Default: **Forward (1/N)**.

For the 2D FFT, N = `width × height`.
For the 1D DFT, N = number of samples.

## Web Worker (2D FFT)

The 2D FFT is computed in a dedicated Web Worker (`fft.worker.ts`) off the main thread. The worker receives the pixel array and settings via `postMessage` and transfers the result buffers back using transferable objects.
