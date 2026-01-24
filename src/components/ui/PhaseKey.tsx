// "use client";

// export default function PhaseKey({ className = "" }: { className?: string }) {
//   // Base: solid white (so alpha blending behaves like your white phase canvas)
//   const base = "linear-gradient(90deg, #ffffff, #ffffff)";

//   // Color field: blue ramp on left, red ramp on right, with BLACK at 0.
//   // This matches your RGB rule r/b = 255 * t where t = |phi|/pi.
//   // NOTE: At ±π/2, t=0.5 => ~128, so we put a mid-stop around that.
//   const color = `
//     linear-gradient(
//       90deg,
//       rgb(0,0,255) 0%,
//       rgb(0,0,128) 25%,
//       rgb(0,0,0)   50%,
//       rgb(128,0,0) 75%,
//       rgb(255,0,0) 100%
//     )
//   `;

//   // Alpha mask: fully opaque for |phi| <= π/2 (center half),
//   // and fades to 0 toward ±π (ends). This mimics your alpha rule.
//   const mask = `
//     linear-gradient(
//       90deg,
//       rgba(255,255,255,0) 0%,
//       rgba(255,255,255,0) 0%,
//       rgba(255,255,255,1) 25%,
//       rgba(255,255,255,1) 75%,
//       rgba(255,255,255,0) 100%
//     )
//   `;

//   // Use CSS mask when available; fallback still looks reasonable.
//   const barStyle: React.CSSProperties = {
//     backgroundImage: `${base}, ${color}`,
//     backgroundBlendMode: "normal",
//     // Mask applies to the whole element, controlling visibility of the color layer.
//     WebkitMaskImage: mask,
//     maskImage: mask,
//     WebkitMaskSize: "100% 100%",
//     maskSize: "100% 100%",
//     WebkitMaskRepeat: "no-repeat",
//     maskRepeat: "no-repeat",
//   };

//   return (
//     <div className={["select-none", className].join(" ")}>
//       <div
//         className="h-3 w-full rounded-full border border-border/60"
//         style={barStyle}
//         aria-label="Phase color key from −π to +π"
//       />
//       <div className="mt-1 flex w-full justify-between text-[11px] text-fg/70">
//         <span>−π</span>
//         <span>0</span>
//         <span>+π</span>
//       </div>
//     </div>
//   );
// }
"use client";

export default function PhaseKey({ className = "" }: { className?: string }) {
  // This gradient is the *visible* result of your RGB + alpha-over-white rule.
  // Stops correspond to: -π, -3π/4, -π/2, -π/4, 0, π/4, π/2, 3π/4, π
  const gradient = `
  linear-gradient(
    90deg,
    rgb(255,255,255) 0%,
    rgb(128,128,223) 12.5%,
    rgb(0,0,128)     25%,
    rgb(0,0,64)      37.5%,
    rgb(0,0,0)       50%,
    rgb(64,0,0)      62.5%,
    rgb(128,0,0)     75%,
    rgb(223,128,128) 87.5%,
    rgb(255,255,255) 100%
  )
`;

  return (
    <div className={["select-none ", className].join(" ")}>
      <div
        className="h-3 w-full shadow rounded-full border border-border"
        style={{ background: gradient }}
        aria-label="Phase color key from −π to +π"
      />
      <div className="mt-1 flex w-full justify-between text-[11px] text-fg/70">
        <span>−π</span>
        <span>0</span>
        <span>+π</span>
      </div>
    </div>
  );
}
