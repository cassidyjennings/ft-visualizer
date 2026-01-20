import React from "react";
import { ToggleIcon, type ToggleIconProps } from "./ToggleIcon";

export function EyeOpenIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="2.5" />
    </ToggleIcon>
  );
}

export function EyeClosedIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" />
      <path d="M9.2 5.5A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.3" />
      <path d="M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7c1.1 0 2.2-.2 3.2-.5" />
    </ToggleIcon>
  );
}
