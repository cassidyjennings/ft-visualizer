import { ImageModel } from "./model";

export type BrushMode = "draw" | "erase";
export type BrushShape = "square" | "circle" | "diamond" | "hline" | "vline" | "cross";

export interface BrushSettings {
  value: number; // 0-255 (ignored for erase)
  radius: number; // 0 = single pixel, 1 = 3x3-ish, etc.
  mode: BrushMode;
  shape: BrushShape;
}

/**
 * Draw a filled stamp of the brush centered at (cx, cy).
 */
export function stampBrush(
  image: ImageModel,
  cx: number,
  cy: number,
  settings: BrushSettings,
  isDark: boolean,
): void {
  const { width, height, data } = image;
  const { radius, mode, value, shape } = settings;
  const bg = isDark ? 0 : 255;
  const paintValue = mode === "erase" ? bg : clampByte(value);

  // radius 0 -> just one pixel
  const r = Math.max(0, Math.floor(radius));

  const x0 = cx - r;
  const x1 = cx + r;
  const y0 = cy - r;
  const y1 = cy + r;

  function shouldPaint(
    shape: BrushShape,
    x: number,
    y: number,
    cx: number,
    cy: number,
    r: number,
  ) {
    const dx = x - cx;
    const dy = y - cy;

    switch (shape) {
      case "square":
        return true;
      case "circle":
        return dx * dx + dy * dy <= r * r;
      case "diamond":
        return Math.abs(dx) + Math.abs(dy) <= r;
      case "hline":
        return Math.abs(dy) <= 0 && Math.abs(dx) <= r;
      case "vline":
        return Math.abs(dx) <= 0 && Math.abs(dy) <= r;
      case "cross":
        return (dx === 0 && Math.abs(dy) <= r) || (dy === 0 && Math.abs(dx) <= r);
      default:
        return true;
    }
  }

  for (let y = y0; y <= y1; y++) {
    if (y < 0 || y >= height) continue;
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || x >= width) continue;

      if (!shouldPaint(shape, x, y, cx, cy, r)) continue;
      data[y * width + x] = paintValue;

      data[y * width + x] = paintValue;
    }
  }
}

/**
 * Draw a continuous stroke from (x0,y0) to (x1,y1) using Bresenham,
 * stamping the brush at each visited pixel.
 */
export function strokeLine(
  image: ImageModel,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  settings: BrushSettings,
  isDark: boolean,
): void {
  // Bresenham's line algorithm
  let x = x0;
  let y = y0;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);

  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;

  let err = dx - dy;

  while (true) {
    stampBrush(image, x, y, settings, isDark);

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function clampByte(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(255, Math.round(v)));
}
