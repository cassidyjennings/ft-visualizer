"use client";

import React, { useId, useMemo } from "react";

type RegalFrameProps = {
  /** unobstructed inner square size (CSS px) */
  innerSize: number;

  /** thickness of the main band around the window */
  frame?: number;

  /** padding outside the band (for shadow/trim breathing room) */
  pad?: number;

  /** 0 = perfect 90° corners */
  r?: number;

  className?: string;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function RegalCanvasFrame({
  innerSize,
  frame = 22,
  pad = 2,
  r = 0,
  className,
}: RegalFrameProps) {
  const uid = useId().replace(/:/g, "");

  // Snap to integers to avoid fractional seams.
  const f = Math.round(frame);
  const p = Math.round(pad);
  const inner = Math.round(innerSize);

  // Outer SVG size (includes pad outside the band)
  const s = inner + 2 * (f + p);

  // Band (frame molding) rectangle
  const bandX = p;
  const bandY = p;
  const bandW = inner + 2 * f;
  const bandH = inner + 2 * f;

  // Window rectangle (the empty hole)
  const winX = p + f;
  const winY = p + f;

  // CSS-variable driven colors
  const primary = "var(--frame-primary)";
  const accent = "var(--frame-accent)";
  const trim = "var(--frame-trim)";

  // -------------------------
  // Dynamic stroke plan
  // -------------------------
  // Available thickness on ONE side of the band is `f`.
  // We place lines at insets from the band outer edge: 0..f.
  // If there isn't room, we skip lines rather than letting them collide.
  const plan = useMemo(() => {
    const side = f; // thickness available on one side

    // Outer trim always okay (1px) as long as we have at least 1px band
    const outerTrim = side >= 1;

    // Inner trim hugs the window: inset = f - 0.5; needs at least ~2px band to look ok
    const innerTrim = side >= 3;

    // Accent “main” line: place around ~25% of band, but clamp away from edges
    // Needs some breathing room so it doesn't sit on top of trims.
    const accentMain = side >= 6;

    // Accent echo line (secondary): only if band is thick enough to fit another line + gap
    const accentEcho = side >= 12;

    // Inset positions (from band outer edge)
    const outerTrimInset = 0.5;

    // Keep inner trim exactly at window edge (minus half pixel for crisp stroke)
    const innerTrimInset = side - 0.5;

    // Accent insets: compute but clamp so it stays between outer trim and inner trim
    // Leave at least 2px from outer, and at least 3px from inner edge.
    const minInset = 2;
    const maxInset = Math.max(minInset, side - 4);

    const accentInset = clamp(Math.round(side * 0.28), minInset, maxInset);

    // Echo is a few px inward from main accent, but only if it fits before inner edge.
    const echoOffset = 3;
    const accentEchoInset = accentInset + echoOffset;
    const echoFits = accentEcho && accentEchoInset <= side - 4;

    // Stroke widths scaled by band thickness
    const accentMainW = side >= 18 ? 2.5 : side >= 10 ? 2 : 1.5;
    const accentEchoW = side >= 18 ? 1.5 : 1;

    // Opacity can go up slightly when strokes get thinner (to stay visible)
    const accentMainOpacity = side >= 18 ? 0.8 : side >= 10 ? 0.85 : 0.9;
    const accentEchoOpacity = side >= 18 ? 0.45 : 0.55;

    return {
      outerTrim,
      innerTrim,
      accentMain,
      accentEcho: echoFits,

      outerTrimInset,
      innerTrimInset,
      accentInset,
      accentEchoInset,

      accentMainW,
      accentEchoW,
      accentMainOpacity,
      accentEchoOpacity,
    };
  }, [f]);

  const maskId = `bandMask-${uid}`;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <defs>
        {/* Mask: show the band, cut out the window.
            White = visible, Black = hole */}
        <mask id={maskId}>
          <rect x="0" y="0" width={s} height={s} fill="black" />
          <rect
            x={bandX}
            y={bandY}
            width={bandW}
            height={bandH}
            fill="white"
            rx={r}
            ry={r}
          />
          <rect x={winX} y={winY} width={inner} height={inner} fill="black" />
        </mask>

        {/* Slight band gradient for depth (optional but helps “cut off” look) */}
        <linearGradient id={`bandGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={primary} stopOpacity="0.92" />
          <stop offset="0.5" stopColor={primary} stopOpacity="1" />
          <stop offset="1" stopColor={primary} stopOpacity="0.94" />
        </linearGradient>
      </defs>

      {/* Band fill (only) */}
      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill={`url(#bandGrad-${uid})`}
        mask={`url(#${maskId})`}
      />

      {/* OUTER TRIM */}
      {plan.outerTrim && (
        <rect
          x={bandX + plan.outerTrimInset}
          y={bandY + plan.outerTrimInset}
          width={bandW - 2 * plan.outerTrimInset}
          height={bandH - 2 * plan.outerTrimInset}
          fill="none"
          stroke={trim}
          strokeWidth={1}
          opacity={0.9}
          mask={`url(#${maskId})`}
        />
      )}

      {/* INNER TRIM */}
      {plan.innerTrim && (
        <rect
          x={bandX + plan.innerTrimInset}
          y={bandY + plan.innerTrimInset}
          width={bandW - 2 * plan.innerTrimInset}
          height={bandH - 2 * plan.innerTrimInset}
          fill="none"
          stroke={trim}
          strokeWidth={1}
          opacity={0.85}
          mask={`url(#${maskId})`}
        />
      )}

      {/* ACCENT MAIN */}
      {plan.accentMain && (
        <rect
          x={bandX + plan.accentInset}
          y={bandY + plan.accentInset}
          width={bandW - 2 * plan.accentInset}
          height={bandH - 2 * plan.accentInset}
          fill="none"
          stroke={accent}
          strokeWidth={plan.accentMainW}
          opacity={plan.accentMainOpacity}
          mask={`url(#${maskId})`}
        />
      )}

      {/* ACCENT ECHO */}
      {plan.accentEcho && (
        <rect
          x={bandX + plan.accentEchoInset}
          y={bandY + plan.accentEchoInset}
          width={bandW - 2 * plan.accentEchoInset}
          height={bandH - 2 * plan.accentEchoInset}
          fill="none"
          stroke={accent}
          strokeWidth={plan.accentEchoW}
          opacity={plan.accentEchoOpacity}
          mask={`url(#${maskId})`}
        />
      )}
    </svg>
  );
}
