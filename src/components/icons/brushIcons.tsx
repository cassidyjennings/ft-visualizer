import React from "react";
import { ToggleIcon, type ToggleIconProps } from "./ToggleIcon";

export function DrawIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props} strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
    </ToggleIcon>
  );
}

export function EraseIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props}>
      <path d="M20 20H9l-4-4 10-10 6 6-7 8z" />
      <path d="M6 16l3 3" />
    </ToggleIcon>
  );
}

export function CircleIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props} strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
    </ToggleIcon>
  );
}

export function SquareIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props} strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" />
    </ToggleIcon>
  );
}

export function DiamondIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props} strokeLinejoin="round">
      <path d="M12 4l8 8-8 8-8-8 8-8z" />
    </ToggleIcon>
  );
}

export function CrossIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props}>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </ToggleIcon>
  );
}

export function HLineIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props}>
      <path d="M6 12h12" />
    </ToggleIcon>
  );
}

export function VLineIcon(props: ToggleIconProps) {
  return (
    <ToggleIcon {...props}>
      <path d="M12 6v12" />
    </ToggleIcon>
  );
}
