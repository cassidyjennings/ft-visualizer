// // "use client";

// // import React, { useEffect, useRef } from "react";
// // import SpectrumCanvasBase, {
// //   SpectrumKey,
// // } from "@/components/canvases/SpectrumCanvasBase";

// // type PhaseCanvasProps = {
// //   fft: { width: number; height: number; real: Float32Array; imag: Float32Array } | null;
// //   selectedSize: number;
// //   px: number;

// //   onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
// //   onPointerMoveHandle: (e: React.PointerEvent) => void;
// //   onPointerUpHandle: () => void;
// // };

// // export default function PhaseCanvas({
// //   fft,
// //   selectedSize,
// //   px,
// //   onPointerDownHandle,
// //   onPointerMoveHandle,
// //   onPointerUpHandle,
// // }: PhaseCanvasProps) {
// //   const canvasRef = useRef<HTMLCanvasElement | null>(null);
// //   const background = fft ? "white" : "var(--null)"; // or "var(--null)"

// //   useEffect(() => {
// //     if (!fft) return;

// //     if (fft.width !== selectedSize || fft.height !== selectedSize) return;

// //     drawPhase(canvasRef.current, fft.real, fft.imag, selectedSize, selectedSize);
// //   }, [fft, selectedSize]);

// //   return (
// //     <SpectrumCanvasBase
// //       label="Phase"
// //       spectrumRef={canvasRef}
// //       selectedSize={selectedSize}
// //       px={px}
// //       background={background}
// //       dragKey="phase"
// //       onPointerDownHandle={onPointerDownHandle}
// //       onPointerMoveHandle={onPointerMoveHandle}
// //       onPointerUpHandle={onPointerUpHandle}
// //       canvas={
// //         <canvas
// //           ref={canvasRef}
// //           width={selectedSize}
// //           height={selectedSize}
// //           className="block"
// //           style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
// //         />
// //       }
// //     />
// //   );
// // }

// // function drawPhase(
// //   canvas: HTMLCanvasElement | null,
// //   real: Float32Array,
// //   imag: Float32Array,
// //   width: number,
// //   height: number,
// // ) {
// //   if (!canvas) return;
// //   const ctx = canvas.getContext("2d");
// //   if (!ctx) return;

// //   // Important: assumes the canvas background is already white.
// //   // If you ever want to enforce it here, uncomment:
// //   ctx.clearRect(0, 0, width, height);
// //   ctx.fillStyle = "#fff";
// //   ctx.fillRect(0, 0, width, height);

// //   const img = ctx.createImageData(width, height);

// //   const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// //   for (let pix_i = 0; pix_i < width * height; pix_i++) {
// //     const re = real[pix_i];
// //     const im = imag[pix_i];
// //     const j = pix_i * 4;

// //     // Zero magnitude: keep your neutral gray, fully opaque.
// //     if (re * re + im * im === 0) {
// //       img.data[j + 0] = 128;
// //       img.data[j + 1] = 128;
// //       img.data[j + 2] = 128;
// //       img.data[j + 3] = 255;
// //       continue;
// //     }

// //     const phi = Math.atan2(im, re); // [-π, +π]
// //     const t = Math.abs(phi) / Math.PI; // 0..1 (matches your original)

// //     // --- Keep SAME COLORING for |phi| <= π/2 ---
// //     // Your original color magnitude is proportional to |phi|/π (i.e., t),
// //     // with sign determining red vs blue.
// //     let r = 0;
// //     const g = 0;
// //     let b = 0;

// //     if (phi > 0) r = Math.round(255 * t);
// //     else if (phi < 0) b = Math.round(255 * t);

// //     // --- Alpha fade to white AFTER |phi| > π/2 ---
// //     // When |phi| <= π/2 → alpha = 1
// //     // When |phi| = π       → alpha = 0
// //     // Map |phi| in [π/2, π] to fade in [1, 0]
// //     const a = Math.abs(phi); // 0..π
// //     let alpha = 1;

// //     if (a > Math.PI / 2) {
// //       // u: 0 at π/2, 1 at π
// //       const u = clamp01((a - Math.PI / 2) / (Math.PI / 2));
// //       // Fade-out curve (tweak exponent if you want it to fall off faster/slower)
// //       alpha = 1 - u;
// //       // // optional easing to look smoother:
// //       // alpha = alpha * alpha; // keeps alpha=1 at π/2 and alpha=0 at π
// //     }

// //     img.data[j + 0] = r;
// //     img.data[j + 1] = g;
// //     img.data[j + 2] = b;
// //     img.data[j + 3] = Math.round(255 * alpha);
// //   }

// //   ctx.putImageData(img, 0, 0);
// // }

// "use client";

// import React, { useRef } from "react";
// import SpectrumCanvasBase, {
//   SpectrumKey,
// } from "@/components/canvases/SpectrumCanvasBase";

// type PhaseCanvasProps = {
//   selectedSize: number;
//   px: number;
//   background: string;

//   onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
//   onPointerMoveHandle: (e: React.PointerEvent) => void;
//   onPointerUpHandle: () => void;

//   // NEW: allow parent to pass a ref if you prefer, or keep internal and expose via prop callback
//   canvasRef?: React.RefObject<HTMLCanvasElement | null>;
// };

// export default function PhaseCanvas({
//   selectedSize,
//   px,
//   background,
//   onPointerDownHandle,
//   onPointerMoveHandle,
//   onPointerUpHandle,
//   canvasRef,
// }: PhaseCanvasProps) {
//   const fallbackRef = useRef<HTMLCanvasElement | null>(null);
//   const refToUse = canvasRef ?? fallbackRef;

//   return (
//     <SpectrumCanvasBase
//       label="Phase"
//       spectrumRef={refToUse}
//       selectedSize={selectedSize}
//       px={px}
//       background={background}
//       dragKey="phase"
//       onPointerDownHandle={onPointerDownHandle}
//       onPointerMoveHandle={onPointerMoveHandle}
//       onPointerUpHandle={onPointerUpHandle}
//       canvas={
//         <canvas
//           ref={refToUse}
//           width={selectedSize}
//           height={selectedSize}
//           className="block"
//           style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
//         />
//       }
//     />
//   );
// }

// "use client";

// import React from "react";

// export type SpectrumKey = "mag" | "phase";

// type SpectrumCanvasBaseProps = {
//   label: React.ReactNode;
//   spectrumRef: React.RefObject<HTMLCanvasElement | null>;
//   canvas: React.ReactNode;
//   background: string;

//   selectedSize: number;
//   px: number;

//   dragKey: SpectrumKey;
//   onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
//   onPointerMoveHandle: (e: React.PointerEvent) => void;
//   onPointerUpHandle: () => void;
// };

// export default function SpectrumCanvasBase({
//   label,
//   canvas,
//   background,
//   px,
//   dragKey,
//   onPointerDownHandle,
//   onPointerMoveHandle,
//   onPointerUpHandle,
// }: SpectrumCanvasBaseProps) {
//   return (
//     <div className="w-full flex flex-col items-center">
//       <div className="mb-2 text-md sm:text-md lg:text-lg text-fg font-serif font-semibold">
//         {label}
//       </div>

//       <div
//         className="relative shadow-lg border-2 border-brand-3"
//         style={{ width: px, height: px, background }}
//       >
//         {canvas}

//         <div
//           className="absolute bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
//           title="Drag to resize"
//           onPointerDown={(e) => onPointerDownHandle(dragKey, e)}
//           onPointerMove={onPointerMoveHandle}
//           onPointerUp={onPointerUpHandle}
//           onPointerCancel={onPointerUpHandle}
//         >
//           <svg viewBox="0 0 16 16" className="h-4 w-4 opacity-80">
//             <path
//               d="M6 14L14 6"
//               stroke="currentColor"
//               strokeWidth="1.5"
//               strokeLinecap="round"
//             />
//             <path
//               d="M9 14L14 9"
//               stroke="currentColor"
//               strokeWidth="1.5"
//               strokeLinecap="round"
//             />
//             <path
//               d="M12 14L14 12"
//               stroke="currentColor"
//               strokeWidth="1.5"
//               strokeLinecap="round"
//             />
//           </svg>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useRef } from "react";
import SpectrumCanvasBase, {
  SpectrumKey,
} from "@/components/canvases/SpectrumCanvasBase";

type PhaseCanvasProps = {
  selectedSize: number;
  px: number;
  background: string;

  onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
  onPointerMoveHandle: (e: React.PointerEvent) => void;
  onPointerUpHandle: () => void;

  // NEW: allow parent to pass a ref if you prefer, or keep internal and expose via prop callback
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
};

export default function PhaseCanvas({
  selectedSize,
  px,
  background,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
  canvasRef,
}: PhaseCanvasProps) {
  const fallbackRef = useRef<HTMLCanvasElement | null>(null);
  const refToUse = canvasRef ?? fallbackRef;

  return (
    <SpectrumCanvasBase
      label="Phase"
      spectrumRef={refToUse}
      selectedSize={selectedSize}
      px={px}
      background={background}
      dragKey="phase"
      onPointerDownHandle={onPointerDownHandle}
      onPointerMoveHandle={onPointerMoveHandle}
      onPointerUpHandle={onPointerUpHandle}
      canvas={
        <canvas
          ref={refToUse}
          width={selectedSize}
          height={selectedSize}
          className="block"
          style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
        />
      }
    />
  );
}
