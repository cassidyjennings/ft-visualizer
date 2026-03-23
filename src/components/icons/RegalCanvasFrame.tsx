// "use client";

// import React, { useId, useMemo } from "react";

// type RegalFrameProps = {
//   innerSize: number;
//   frame?: number;
//   pad?: number;
//   r?: number;
//   className?: string;
// };

// function clamp(v: number, lo: number, hi: number) {
//   return Math.max(lo, Math.min(hi, v));
// }

// export default function RegalCanvasFrame({
//   innerSize,
//   frame = 22,
//   pad = 2,
//   r = 0,
//   className,
// }: RegalFrameProps) {
//   const uid = useId().replace(/:/g, "");

//   // Snap to integers to reduce seams.
//   const f = Math.round(frame);
//   const p = Math.round(pad);
//   const inner = Math.round(innerSize);

//   const s = inner + 2 * (f + p);

//   // Band (frame molding) rectangle
//   const bandX = p;
//   const bandY = p;
//   const bandW = inner + 2 * f;
//   const bandH = inner + 2 * f;

//   // Window (hole)
//   const winX = p + f;
//   const winY = p + f;

//   // CSS-variable driven colors
//   const primary = "var(--frame-primary)";
//   const accent = "var(--frame-accent)";
//   const trim = "var(--frame-trim)";

//   // ---- Dynamic plan (drop layers when thin) ----
//   const plan = useMemo(() => {
//     const side = f;

//     const outerTrim = side >= 1;
//     const innerTrim = side >= 3;

//     // We’ll treat accents as decorative “inlays”
//     const accentMain = side >= 8;
//     const accentEcho = side >= 14;

//     // Miter seam thickness (visual) scales down when thin
//     const seam = side >= 16 ? 2 : side >= 10 ? 1.5 : 1;

//     // Outer trim inset
//     const outerTrimInset = 0.5;

//     // Inner trim hugging window
//     const innerTrimInset = side - 0.5;

//     // Accent inlay position: keep it between trims with breathing room
//     const minInset = 2;
//     const maxInset = Math.max(minInset, side - 5);
//     const accentInset = clamp(Math.round(side * 0.32), minInset, maxInset);

//     const echoOffset = 3;
//     const accentEchoInset = accentInset + echoOffset;
//     const echoFits = accentEcho && accentEchoInset <= side - 5;

//     // “Real frame” bevel widths (lip + highlight)
//     const lip = clamp(Math.round(side * 0.22), 2, 6); // inner chamfer/lip
//     const bevel = clamp(Math.round(side * 0.18), 2, 5); // outer bevel

//     // Accent line weights
//     const accentMainW = side >= 18 ? 3 : side >= 12 ? 2.5 : 2;
//     const accentEchoW = side >= 18 ? 2 : 1.5;

//     return {
//       outerTrim,
//       innerTrim,
//       accentMain,
//       accentEcho: echoFits,

//       outerTrimInset,
//       innerTrimInset,
//       accentInset,
//       accentEchoInset,

//       seam,
//       lip,
//       bevel,

//       accentMainW,
//       accentEchoW,
//     };
//   }, [f]);

//   const maskId = `bandMask-${uid}`;

//   // Helper sizes
//   const bandGradId = `bandGrad-${uid}`;
//   const sheenId = `sheen-${uid}`;
//   const noiseId = `noise-${uid}`;

//   // Miter seams: 45° cut lines near each corner (all on band, never in window)
//   // We draw them as tiny diagonal strokes. Keep them inside the band with padding.
//   const seamInset = Math.max(2, Math.floor(f * 0.18));
//   const seamLen = Math.max(8, Math.floor(f * 1.15));

//   const seams = [
//     // TL
//     {
//       x1: bandX + seamInset,
//       y1: bandY + seamInset + seamLen,
//       x2: bandX + seamInset + seamLen,
//       y2: bandY + seamInset,
//     },
//     // TR
//     {
//       x1: bandX + bandW - seamInset - seamLen,
//       y1: bandY + seamInset,
//       x2: bandX + bandW - seamInset,
//       y2: bandY + seamInset + seamLen,
//     },
//     // BL
//     {
//       x1: bandX + seamInset,
//       y1: bandY + bandH - seamInset - seamLen,
//       x2: bandX + seamInset + seamLen,
//       y2: bandY + bandH - seamInset,
//     },
//     // BR
//     {
//       x1: bandX + bandW - seamInset - seamLen,
//       y1: bandY + bandH - seamInset,
//       x2: bandX + bandW - seamInset,
//       y2: bandY + bandH - seamInset - seamLen,
//     },
//   ];

//   return (
//     <svg
//       width={s}
//       height={s}
//       viewBox={`0 0 ${s} ${s}`}
//       className={className}
//       xmlns="http://www.w3.org/2000/svg"
//       shapeRendering="geometricPrecision"
//     >
//       <defs>
//         {/* Band-only mask (hole cut out) */}
//         <mask id={maskId}>
//           <rect x="0" y="0" width={s} height={s} fill="black" />
//           <rect
//             x={bandX}
//             y={bandY}
//             width={bandW}
//             height={bandH}
//             fill="white"
//             rx={r}
//             ry={r}
//           />
//           <rect x={winX} y={winY} width={inner} height={inner} fill="black" />
//         </mask>

//         {/* Base band gradient (depth) */}
//         <linearGradient id={bandGradId} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0" stopColor={primary} stopOpacity="0.92" />
//           <stop offset="0.45" stopColor={primary} stopOpacity="1" />
//           <stop offset="1" stopColor={primary} stopOpacity="0.94" />
//         </linearGradient>

//         {/* Subtle sheen across the band (makes it “lacquered”) */}
//         <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="1">
//           <stop offset="0" stopColor="white" stopOpacity="0.10" />
//           <stop offset="0.35" stopColor="white" stopOpacity="0.00" />
//           <stop offset="0.65" stopColor="white" stopOpacity="0.00" />
//           <stop offset="1" stopColor="white" stopOpacity="0.06" />
//         </linearGradient>

//         {/* Micro texture */}
//         <filter id={noiseId} x="-10%" y="-10%" width="120%" height="120%">
//           <feTurbulence
//             type="fractalNoise"
//             baseFrequency="0.9"
//             numOctaves="2"
//             stitchTiles="stitch"
//           />
//           <feColorMatrix
//             type="matrix"
//             values="
//               1 0 0 0 0
//               0 1 0 0 0
//               0 0 1 0 0
//               0 0 0 0.05 0"
//           />
//         </filter>
//       </defs>

//       {/* Base band */}
//       <rect
//         x={bandX}
//         y={bandY}
//         width={bandW}
//         height={bandH}
//         rx={r}
//         ry={r}
//         fill={`url(#${bandGradId})`}
//         mask={`url(#${maskId})`}
//       />

//       {/* Sheen overlay */}
//       <rect
//         x={bandX}
//         y={bandY}
//         width={bandW}
//         height={bandH}
//         rx={r}
//         ry={r}
//         fill={`url(#${sheenId})`}
//         opacity={0.8}
//         mask={`url(#${maskId})`}
//       />

//       {/* Texture overlay */}
//       <rect
//         x={bandX}
//         y={bandY}
//         width={bandW}
//         height={bandH}
//         rx={r}
//         ry={r}
//         fill="#fff"
//         filter={`url(#${noiseId})`}
//         opacity={0.7}
//         mask={`url(#${maskId})`}
//       />

//       {/* Outer bevel shadow (gives thickness) */}
//       {plan.bevel >= 2 && (
//         <rect
//           x={bandX + 1}
//           y={bandY + 1}
//           width={bandW - 2}
//           height={bandH - 2}
//           fill="none"
//           stroke="rgba(0,0,0,0.22)"
//           strokeWidth={plan.bevel}
//           mask={`url(#${maskId})`}
//         />
//       )}

//       {/* Inner lip highlight (like the inner rabbet that holds the “glass”) */}
//       {plan.lip >= 2 && (
//         <rect
//           x={winX - plan.lip}
//           y={winY - plan.lip}
//           width={inner + 2 * plan.lip}
//           height={inner + 2 * plan.lip}
//           fill="none"
//           stroke="rgba(255,255,255,0.12)"
//           strokeWidth={plan.lip}
//           mask={`url(#${maskId})`}
//         />
//       )}

//       {/* Outer trim (metallic hairline) */}
//       {plan.outerTrim && (
//         <rect
//           x={bandX + plan.outerTrimInset}
//           y={bandY + plan.outerTrimInset}
//           width={bandW - 2 * plan.outerTrimInset}
//           height={bandH - 2 * plan.outerTrimInset}
//           fill="none"
//           stroke={trim}
//           strokeWidth={1}
//           opacity={0.9}
//           mask={`url(#${maskId})`}
//         />
//       )}

//       {/* Inner trim (hairline at window) */}
//       {plan.innerTrim && (
//         <rect
//           x={bandX + plan.innerTrimInset}
//           y={bandY + plan.innerTrimInset}
//           width={bandW - 2 * plan.innerTrimInset}
//           height={bandH - 2 * plan.innerTrimInset}
//           fill="none"
//           stroke={trim}
//           strokeWidth={1}
//           opacity={0.85}
//           mask={`url(#${maskId})`}
//         />
//       )}

//       {/* Accent inlay (stronger, “decorative band”) */}
//       {plan.accentMain && (
//         <rect
//           x={bandX + plan.accentInset}
//           y={bandY + plan.accentInset}
//           width={bandW - 2 * plan.accentInset}
//           height={bandH - 2 * plan.accentInset}
//           fill="none"
//           stroke={accent}
//           strokeWidth={plan.accentMainW}
//           opacity={0.85}
//           mask={`url(#${maskId})`}
//         />
//       )}

//       {/* Accent echo (only if thick enough) */}
//       {plan.accentEcho && (
//         <rect
//           x={bandX + plan.accentEchoInset}
//           y={bandY + plan.accentEchoInset}
//           width={bandW - 2 * plan.accentEchoInset}
//           height={bandH - 2 * plan.accentEchoInset}
//           fill="none"
//           stroke={accent}
//           strokeWidth={plan.accentEchoW}
//           opacity={0.55}
//           mask={`url(#${maskId})`}
//         />
//       )}

//       {/* Bright seam highlight (subtle, makes it feel like cut wood) */}
//       {f >= 12 &&
//         seams.map((seg, i) => (
//           <path
//             key={`h-${i}`}
//             d={`M ${seg.x1 + 0.6} ${seg.y1 + 0.6} L ${seg.x2 + 0.6} ${seg.y2 + 0.6}`}
//             stroke="rgba(255,255,255,0.10)"
//             strokeWidth={Math.max(1, plan.seam - 0.5)}
//             strokeLinecap="round"
//             mask={`url(#${maskId})`}
//           />
//         ))}
//     </svg>
//   );
// }

"use client";

import React, { useId, useMemo } from "react";

type RegalFrameProps = {
  innerSize: number;
  frame?: number;
  pad?: number;
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

  const f = Math.round(frame);
  const p = Math.round(pad);
  const inner = Math.round(innerSize);

  const s = inner + 2 * (f + p);

  const bandX = p;
  const bandY = p;
  const bandW = inner + 2 * f;
  const bandH = inner + 2 * f;

  const winX = p + f;
  const winY = p + f;

  const primary = "var(--frame-primary)";
  const accent = "var(--frame-accent)";
  const trim = "var(--frame-trim)";

  const plan = useMemo(() => {
    const side = f;

    const outerTrim = side >= 1;
    const innerTrim = side >= 3;

    const accentMain = side >= 8;
    const accentEcho = side >= 14;

    const seam = side >= 16 ? 2 : side >= 10 ? 1.5 : 1;

    const outerTrimInset = 0.5;
    const innerTrimInset = side - 0.5;

    const minInset = 2;
    const maxInset = Math.max(minInset, side - 5);
    const accentInset = clamp(Math.round(side * 0.32), minInset, maxInset);

    const echoOffset = 3;
    const accentEchoInset = accentInset + echoOffset;
    const echoFits = accentEcho && accentEchoInset <= side - 5;

    const lip = clamp(Math.round(side * 0.22), 2, 6);
    const bevel = clamp(Math.round(side * 0.18), 2, 5);

    const accentMainW = side >= 18 ? 3 : side >= 12 ? 2.5 : 2;
    const accentEchoW = side >= 18 ? 2 : 1.5;

    // NEW: rabbet depth (the “recess”)
    const rabbet = clamp(Math.round(side * 0.18), 2, 6);

    return {
      outerTrim,
      innerTrim,
      accentMain,
      accentEcho: echoFits,

      outerTrimInset,
      innerTrimInset,
      accentInset,
      accentEchoInset,

      seam,
      lip,
      bevel,
      rabbet,

      accentMainW,
      accentEchoW,
    };
  }, [f]);

  const maskId = `bandMask-${uid}`;
  const bandGradId = `bandGrad-${uid}`;
  const vignetteId = `vignette-${uid}`;
  const specId = `spec-${uid}`;
  const noiseId = `noise-${uid}`;
  const grainId = `grain-${uid}`;

  // Corner seam strokes (keep your existing)
  const seamInset = Math.max(2, Math.floor(f * 0.18));
  const seamLen = Math.max(8, Math.floor(f * 1.15));

  const seams = [
    {
      x1: bandX + seamInset,
      y1: bandY + seamInset + seamLen,
      x2: bandX + seamInset + seamLen,
      y2: bandY + seamInset,
    },
    {
      x1: bandX + bandW - seamInset - seamLen,
      y1: bandY + seamInset,
      x2: bandX + bandW - seamInset,
      y2: bandY + seamInset + seamLen,
    },
    {
      x1: bandX + seamInset,
      y1: bandY + bandH - seamInset - seamLen,
      x2: bandX + seamInset + seamLen,
      y2: bandY + bandH - seamInset,
    },
    {
      x1: bandX + bandW - seamInset - seamLen,
      y1: bandY + bandH - seamInset,
      x2: bandX + bandW - seamInset,
      y2: bandY + bandH - seamInset - seamLen,
    },
  ];

  // Helpers for “metal trim” highlight/shadow offsets
  const metalHi = 0.5;
  const metalLo = -0.5;

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
        {/* Band-only mask (hole cut out) */}
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

        {/* Base band gradient */}
        <linearGradient id={bandGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={primary} stopOpacity="0.92" />
          <stop offset="0.45" stopColor={primary} stopOpacity="1" />
          <stop offset="1" stopColor={primary} stopOpacity="0.94" />
        </linearGradient>

        {/* Edge vignette: darker near outer + inner edges (real frames do this) */}
        <radialGradient id={vignetteId} cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor="black" stopOpacity="0" />
          <stop offset="80%" stopColor="black" stopOpacity="0.10" />
          <stop offset="100%" stopColor="black" stopOpacity="0.18" />
        </radialGradient>

        {/* Vertical specular band (light from above, NOT diagonal) */}
        <linearGradient id={specId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.10" />
          <stop offset="0.25" stopColor="white" stopOpacity="0.04" />
          <stop offset="0.6" stopColor="white" stopOpacity="0.00" />
          <stop offset="1" stopColor="white" stopOpacity="0.05" />
        </linearGradient>

        {/* Fine noise */}
        <filter id={noiseId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.05 0"
          />
        </filter>

        {/* Subtle wood grain (very low) */}
        <filter id={grainId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.03 0.22"
            numOctaves="1"
            seed="2"
          />
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.08 0"
          />
        </filter>
      </defs>

      {/* Base band */}
      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill={`url(#${bandGradId})`}
        mask={`url(#${maskId})`}
      />

      {/* Vignette shading across the band */}
      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill={`url(#${vignetteId})`}
        mask={`url(#${maskId})`}
      />

      {/* Vertical specular overlay */}
      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill={`url(#${specId})`}
        opacity={0.9}
        mask={`url(#${maskId})`}
      />

      {/* Fine noise */}
      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill="#fff"
        filter={`url(#${noiseId})`}
        opacity={0.7}
        mask={`url(#${maskId})`}
      />

      {/* Grain (very subtle) */}
      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill="#fff"
        filter={`url(#${grainId})`}
        opacity={0.55}
        mask={`url(#${maskId})`}
      />

      {/* Outer bevel shadow */}
      {plan.bevel >= 2 && (
        <rect
          x={bandX + 1}
          y={bandY + 1}
          width={bandW - 2}
          height={bandH - 2}
          fill="none"
          stroke="rgba(0,0,0,0.22)"
          strokeWidth={plan.bevel}
          mask={`url(#${maskId})`}
        />
      )}

      {/* Outer bevel highlight (thin hairline on top/left edge) */}
      {f >= 8 && (
        <rect
          x={bandX + 0.5}
          y={bandY + 0.5}
          width={bandW - 1}
          height={bandH - 1}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
          mask={`url(#${maskId})`}
        />
      )}

      {/* Rabbet shadow (the inner recess where “glass” sits) */}
      {plan.rabbet >= 2 && (
        <>
          {/* darker bottom/right */}
          <rect
            x={winX - plan.rabbet}
            y={winY - plan.rabbet}
            width={inner + 2 * plan.rabbet}
            height={inner + 2 * plan.rabbet}
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth={plan.rabbet}
            mask={`url(#${maskId})`}
            transform="translate(0.6 0.6)"
          />
          {/* lighter top/left */}
          <rect
            x={winX - plan.rabbet}
            y={winY - plan.rabbet}
            width={inner + 2 * plan.rabbet}
            height={inner + 2 * plan.rabbet}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={Math.max(1, plan.rabbet - 1)}
            mask={`url(#${maskId})`}
            transform="translate(-0.4 -0.4)"
          />
        </>
      )}

      {/* Metallic outer trim (3-pass: base + highlight + shadow) */}
      {plan.outerTrim && (
        <>
          <rect
            x={bandX + plan.outerTrimInset}
            y={bandY + plan.outerTrimInset}
            width={bandW - 2 * plan.outerTrimInset}
            height={bandH - 2 * plan.outerTrimInset}
            fill="none"
            stroke={trim}
            strokeWidth={1}
            opacity={0.95}
            mask={`url(#${maskId})`}
          />
          <rect
            x={bandX + plan.outerTrimInset}
            y={bandY + plan.outerTrimInset}
            width={bandW - 2 * plan.outerTrimInset}
            height={bandH - 2 * plan.outerTrimInset}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
            opacity={0.8}
            mask={`url(#${maskId})`}
            transform={`translate(${metalHi} ${metalHi})`}
          />
          <rect
            x={bandX + plan.outerTrimInset}
            y={bandY + plan.outerTrimInset}
            width={bandW - 2 * plan.outerTrimInset}
            height={bandH - 2 * plan.outerTrimInset}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1}
            opacity={0.7}
            mask={`url(#${maskId})`}
            transform={`translate(${metalLo} ${metalLo})`}
          />
        </>
      )}

      {/* Inner trim (metallic) */}
      {plan.innerTrim && (
        <>
          <rect
            x={bandX + plan.innerTrimInset}
            y={bandY + plan.innerTrimInset}
            width={bandW - 2 * plan.innerTrimInset}
            height={bandH - 2 * plan.innerTrimInset}
            fill="none"
            stroke={trim}
            strokeWidth={1}
            opacity={0.9}
            mask={`url(#${maskId})`}
          />
          <rect
            x={bandX + plan.innerTrimInset}
            y={bandY + plan.innerTrimInset}
            width={bandW - 2 * plan.innerTrimInset}
            height={bandH - 2 * plan.innerTrimInset}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={1}
            opacity={0.7}
            mask={`url(#${maskId})`}
            transform={`translate(${metalHi} ${metalHi})`}
          />
        </>
      )}

      {/* Accent inlay */}
      {plan.accentMain && (
        <rect
          x={bandX + plan.accentInset}
          y={bandY + plan.accentInset}
          width={bandW - 2 * plan.accentInset}
          height={bandH - 2 * plan.accentInset}
          fill="none"
          stroke={accent}
          strokeWidth={plan.accentMainW}
          opacity={0.9}
          mask={`url(#${maskId})`}
        />
      )}

      {plan.accentEcho && (
        <rect
          x={bandX + plan.accentEchoInset}
          y={bandY + plan.accentEchoInset}
          width={bandW - 2 * plan.accentEchoInset}
          height={bandH - 2 * plan.accentEchoInset}
          fill="none"
          stroke={accent}
          strokeWidth={plan.accentEchoW}
          opacity={0.6}
          mask={`url(#${maskId})`}
        />
      )}

      {/* Miter seam highlight (your existing cue) */}
      {f >= 12 &&
        seams.map((seg, i) => (
          <path
            key={`h-${i}`}
            d={`M ${seg.x1 + 0.6} ${seg.y1 + 0.6} L ${seg.x2 + 0.6} ${seg.y2 + 0.6}`}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={Math.max(1, plan.seam - 0.5)}
            strokeLinecap="round"
            mask={`url(#${maskId})`}
          />
        ))}
    </svg>
  );
}
