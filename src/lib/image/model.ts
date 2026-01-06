export interface ImageModel {
  width: number;
  height: number;
  data: Uint8Array; // grayscale 0–255
}

export function createEmptyImage(size: number, value = 0): ImageModel {
  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size).fill(value),
  };
}
