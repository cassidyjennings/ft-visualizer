import { ImageModel } from "./model";

// Placeholder for brush logic
export function drawPixel(image: ImageModel, x: number, y: number, value: number): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  image.data[y * image.width + x] = value;
}
