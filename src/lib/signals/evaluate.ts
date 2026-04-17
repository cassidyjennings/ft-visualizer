import type { SignalLayer } from "./types";

/** Evaluate a single signal layer for N samples. */
export function evaluateLayer(
  layer: SignalLayer,
  N: number,
  userInputData?: number[],
): number[] {
  const result = new Array(N).fill(0);

  if (layer.type === "user-input") {
    for (let n = 0; n < N; n++) {
      result[n] = layer.amplitude * (userInputData?.[n] ?? 0);
    }
    return result;
  }

  if (layer.type === "constant") {
    for (let n = 0; n < N; n++) {
      result[n] = layer.amplitude;
    }
    return result;
  }

  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * n) / layer.period;
    switch (layer.type) {
      case "sine":
        result[n] = layer.amplitude * Math.sin(angle);
        break;
      case "cosine":
        result[n] = layer.amplitude * Math.cos(angle);
        break;
      case "square":
        result[n] = layer.amplitude * Math.sign(Math.sin(angle));
        break;
    }
  }
  return result;
}

/** Compute the mixed signal: weighted sum of all layers. */
export function evaluateMix(
  layers: SignalLayer[],
  N: number,
  userInputData: number[],
): number[] {
  const result = new Array(N).fill(0);
  for (const layer of layers) {
    const values = evaluateLayer(layer, N, userInputData);
    for (let n = 0; n < N; n++) {
      result[n] += values[n];
    }
  }
  return result;
}

/** Sum of all non-user-input layers at a given sample index. */
export function sumOtherLayersAt(
  layers: SignalLayer[],
  N: number,
  index: number,
): number {
  let sum = 0;
  for (const layer of layers) {
    if (layer.type === "user-input") continue;
    if (layer.type === "constant") {
      sum += layer.amplitude;
      continue;
    }
    const angle = (2 * Math.PI * index) / layer.period;
    switch (layer.type) {
      case "sine":
        sum += layer.amplitude * Math.sin(angle);
        break;
      case "cosine":
        sum += layer.amplitude * Math.cos(angle);
        break;
      case "square":
        sum += layer.amplitude * Math.sign(Math.sin(angle));
        break;
    }
  }
  return sum;
}
