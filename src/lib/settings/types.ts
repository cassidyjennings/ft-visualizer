export type DisplayColoring = "system" | "dark" | "light";
export type CenterConvention = "centerPixel" | "centerBetween" | "topLeft";
export type ShiftConvention = "shifted" | "unshifted";
export type MagScale = "linear" | "log";
export type MagNormalize = "max" | "none";
export type FFTNormalization = "none" | "forward" | "inverse" | "unitary";
/** Where n=0 appears on the 1D stem plot x-axis. */
export type Axis1DOrigin = "left" | "center";

export type Settings = {
  coloring: DisplayColoring;
  center: CenterConvention;
  shift: ShiftConvention;
  magScale: MagScale;
  magNormalize: MagNormalize;
  normalization: FFTNormalization;
  /** Where n=0 is shown on the 1D axis page (left edge or centered). */
  axis1DOrigin: Axis1DOrigin;
};
