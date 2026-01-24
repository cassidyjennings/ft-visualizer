export type DisplayColoring = "system" | "dark" | "light";
export type CenterConvention = "centerPixel" | "centerBetween" | "topLeft";
export type ShiftConvention = "shifted" | "unshifted";
export type MagScale = "linear" | "log";
export type FFTNormalization = "none" | "forward" | "inverse" | "unitary";

export type Settings = {
  coloring: DisplayColoring;
  center: CenterConvention;
  shift: ShiftConvention;
  magScale: MagScale;
  normalization: FFTNormalization;
};
