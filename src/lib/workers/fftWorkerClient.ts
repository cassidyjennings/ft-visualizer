export function makeFFTWorker(): Worker {
  // Next can bundle workers created with new URL(...)
  return new Worker(new URL("./fft.worker.ts", import.meta.url));
}
