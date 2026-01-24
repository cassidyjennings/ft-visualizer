// "use client";

// import React, { useEffect, useRef } from "react";
// import SpectrumCanvasBase, {
//   SpectrumKey,
// } from "@/components/canvases/SpectrumCanvasBase";

// function clamp(v: number, lo: number, hi: number) {
//   return Math.max(lo, Math.min(hi, v));
// }

// type MagnitudeCanvasProps = {
//   fft: { width: number; height: number; real: Float32Array; imag: Float32Array } | null;
//   selectedSize: number;
//   px: number;
//   scale: "linear" | "log";
//   isDark: boolean;

//   onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
//   onPointerMoveHandle: (e: React.PointerEvent) => void;
//   onPointerUpHandle: () => void;
// };

// export default function MagnitudeCanvas({
//   fft,
//   selectedSize,
//   px,
//   scale,
//   isDark,
//   onPointerDownHandle,
//   onPointerMoveHandle,
//   onPointerUpHandle,
// }: MagnitudeCanvasProps) {
//   const bg = isDark ? "black" : "white";
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);

//   useEffect(() => {
//     if (!fft) return;
//     if (fft.width !== selectedSize || fft.height !== selectedSize) return;

//     drawMagnitude(
//       canvasRef.current,
//       fft.real,
//       fft.imag,
//       selectedSize,
//       selectedSize,
//       scale,
//       isDark,
//     );
//   }, [fft, selectedSize, scale, isDark]);

//   return (
//     <SpectrumCanvasBase
//       label={<>Magnitude</>}
//       spectrumRef={canvasRef}
//       selectedSize={selectedSize}
//       px={px}
//       background={bg}
//       dragKey="mag"
//       onPointerDownHandle={onPointerDownHandle}
//       onPointerMoveHandle={onPointerMoveHandle}
//       onPointerUpHandle={onPointerUpHandle}
//       canvas={
//         <canvas
//           ref={canvasRef}
//           width={selectedSize}
//           height={selectedSize}
//           className="block"
//           style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
//         />
//       }
//     />
//   );
// }

// function drawMagnitude(
//   canvas: HTMLCanvasElement | null,
//   real: Float32Array,
//   imag: Float32Array,
//   width: number,
//   height: number,
//   scale: "linear" | "log",
//   isDark: boolean,
// ) {
//   if (!canvas) return;
//   const ctx = canvas.getContext("2d");
//   if (!ctx) return;

//   const img = ctx.createImageData(width, height);

//   let maxV = 0;
//   const vals = new Float32Array(width * height);

//   for (let i = 0; i < vals.length; i++) {
//     const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
//     const v = scale === "log" ? Math.log1p(mag) : mag;
//     vals[i] = v;
//     if (v > maxV) maxV = v;
//   }

//   const eps = 1e-12;
//   const constantField = maxV <= eps;

//   for (let i = 0; i < vals.length; i++) {
//     // If everything is (near) zero, keep it zero.
//     // Otherwise normalize by max.
//     const t = constantField ? 0 : clamp(vals[i] / maxV, 0, 1);

//     let g = Math.floor(255 * t);

//     // Flip for light mode so "high magnitude" renders black in light, white in dark
//     if (!isDark) g = 255 - g;

//     const j = i * 4;
//     img.data[j + 0] = g;
//     img.data[j + 1] = g;
//     img.data[j + 2] = g;
//     img.data[j + 3] = 255;
//   }

//   ctx.putImageData(img, 0, 0);
// }

"use client";

import React, { useRef } from "react";
import SpectrumCanvasBase, {
  SpectrumKey,
} from "@/components/canvases/SpectrumCanvasBase";

type MagnitudeCanvasProps = {
  selectedSize: number;
  px: number;
  background: string;

  onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
  onPointerMoveHandle: (e: React.PointerEvent) => void;
  onPointerUpHandle: () => void;

  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
};

export default function MagnitudeCanvas({
  selectedSize,
  px,
  background,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
  canvasRef,
}: MagnitudeCanvasProps) {
  const fallbackRef = useRef<HTMLCanvasElement | null>(null);
  const refToUse = canvasRef ?? fallbackRef;

  return (
    <SpectrumCanvasBase
      label="Magnitude"
      spectrumRef={refToUse}
      selectedSize={selectedSize}
      px={px}
      background={background}
      dragKey="mag"
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
