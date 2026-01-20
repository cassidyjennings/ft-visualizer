import React from "react";

export type ToggleIconProps = React.SVGProps<SVGSVGElement> & {
  size?: number; // px
};

export function ToggleIcon({
  size = 20,
  className,
  style,
  children,
  ...svgProps
}: ToggleIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svgProps}
    >
      {children}
    </svg>
  );
}
