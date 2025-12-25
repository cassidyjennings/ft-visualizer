/**
 * Moves the DC component to the center of the image.
 * @param real Real array.
 * @param imag Imaginary array.
 * @param width Image width.
 * @param height Image height.
 */
export function fftshift2dInPlace(
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
): void {
  const halfW = width >> 1;
  const halfH = height >> 1;

  function swap(i: number, j: number) {
    let temp = real[i];
    real[i] = real[j];
    real[j] = temp;
    temp = imag[i];
    imag[i] = imag[j];
    imag[j] = temp;
  }

  // Swap quadrants:
  // (0,0) <-> (halfW, halfH)
  // (halfW,0) <-> (0, halfH)
  for (let y = 0; y < halfH; y++) {
    for (let x = 0; x < halfW; x++) {
      const i00 = y * width + x;
      const i11 = (y + halfH) * width + (x + halfW);
      swap(i00, i11);

      const i10 = y * width + (x + halfW);
      const i01 = (y + halfH) * width + x;
      swap(i10, i01);
    }
  }
}
