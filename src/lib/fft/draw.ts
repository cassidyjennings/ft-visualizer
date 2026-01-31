// src/lib/fft/draw.ts
export type FFTState = {
  width: number;
  height: number;
  real: Float32Array;
  imag: Float32Array;
};

export type MagNorm = "max" | "none";

export type MagnitudeStats = {
  maxV: number; // max of the *display space* values (mag or log1p(mag))
  scale: "linear" | "log";
  normalize: MagNorm;
  n: number; // width of canvas
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function fillCanvas(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  cssColor: string,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // IMPORTANT: use bitmap dimensions, not px (CSS size)
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, width, height);
}

export function drawMagnitude(
  canvas: HTMLCanvasElement | null,
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
  scale: "linear" | "log",
  normalize: MagNorm,
  isDark: boolean,
): MagnitudeStats | null {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const img = ctx.createImageData(width, height);

  // Compute display-space values and max (only needed for "max" normalization
  // and for the key labels).
  let maxV = 0;
  const vals = new Float32Array(width * height);

  for (let i = 0; i < vals.length; i++) {
    const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    const v = scale === "log" ? Math.log1p(mag) : mag; // display-space value
    vals[i] = v;
    if (v > maxV) maxV = v;
  }

  const eps = 1e-12;
  const constantField = maxV <= eps;

  for (let i = 0; i < vals.length; i++) {
    let t: number;

    if (normalize === "max") {
      t = constantField ? 0 : clamp(vals[i] / maxV, 0, 1);
    } else {
      // normalize === "none": no rescaling. We assume vals[i] is already meaningful in [0,1].
      // (If not, it will clip — which is exactly what "none" should do.)
      t = clamp(vals[i], 0, 1);
    }

    let g = Math.floor(255 * t);
    if (!isDark) g = 255 - g;

    const j = i * 4;
    img.data[j + 0] = g;
    img.data[j + 1] = g;
    img.data[j + 2] = g;
    img.data[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  return { maxV, scale, normalize, n: width };
}

export function drawPhase(
  canvas: HTMLCanvasElement | null,
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
  // Keep your "zero magnitude color" configurable if you want:
  nullRgb: [number, number, number] = [128, 128, 128],
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const img = ctx.createImageData(width, height);

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  for (let pix_i = 0; pix_i < width * height; pix_i++) {
    const re = real[pix_i];
    const im = imag[pix_i];
    const j = pix_i * 4;

    if (re * re + im * im === 0) {
      img.data[j + 0] = nullRgb[0];
      img.data[j + 1] = nullRgb[1];
      img.data[j + 2] = nullRgb[2];
      img.data[j + 3] = 255;
      continue;
    }

    const phi = Math.atan2(im, re); // [-π, +π]
    const t = Math.abs(phi) / Math.PI; // 0..1

    let r = 0;
    const g = 0;
    let b = 0;

    if (phi > 0) r = Math.round(255 * t);
    else if (phi < 0) b = Math.round(255 * t);

    const a = Math.abs(phi);
    let alpha = 1;
    if (a > Math.PI / 2) {
      const u = clamp01((a - Math.PI / 2) / (Math.PI / 2));
      alpha = 1 - u;
    }

    img.data[j + 0] = r;
    img.data[j + 1] = g;
    img.data[j + 2] = b;
    img.data[j + 3] = Math.round(255 * alpha);
  }

  ctx.putImageData(img, 0, 0);
}
