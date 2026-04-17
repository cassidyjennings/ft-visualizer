export type SignalType = "sine" | "cosine" | "square" | "constant" | "user-input";

export type SignalLayer = {
  id: string;
  type: SignalType;
  amplitude: number;
  coefficient: number;
  period: number;
};

export const SIGNAL_TYPE_OPTIONS: { value: SignalType; label: string }[] = [
  { value: "sine", label: "Sine" },
  { value: "cosine", label: "Cosine" },
  { value: "square", label: "Square" },
  { value: "constant", label: "Constant" },
];

let _nextId = 1;
export function newLayerId(): string {
  return `layer-${_nextId++}`;
}
