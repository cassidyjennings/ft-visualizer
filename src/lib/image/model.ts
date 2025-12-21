export interface ImageModel {
  width: number;
  height: number;
  data: Uint8Array; // grayscale 0–255
}

export function createEmptyImage(width: number, height: number, value = 0): ImageModel {
  return {
    width,
    height,
    data: new Uint8Array(width * height).fill(value),
  };
}
