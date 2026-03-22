// "use client";

// import React, { useRef } from "react";
// import SpectrumCanvasBase, {
//   SpectrumKey,
// } from "@/components/canvases/SpectrumCanvasBase";

// type MagnitudeCanvasProps = {
//   selectedSize: number;
//   px: number;
//   background: string;

//   onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
//   onPointerMoveHandle: (e: React.PointerEvent) => void;
//   onPointerUpHandle: () => void;

//   canvasRef?: React.RefObject<HTMLCanvasElement | null>;
// };

// export default function MagnitudeCanvas({
//   selectedSize,
//   px,
//   background,
//   onPointerDownHandle,
//   onPointerMoveHandle,
//   onPointerUpHandle,
//   canvasRef,
// }: MagnitudeCanvasProps) {
//   const fallbackRef = useRef<HTMLCanvasElement | null>(null);
//   const refToUse = canvasRef ?? fallbackRef;

//   return (
//     <SpectrumCanvasBase
//       label="Magnitude"
//       spectrumRef={refToUse}
//       selectedSize={selectedSize}
//       px={px}
//       background={background}
//       dragKey="mag"
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

  keyContent?: React.ReactNode;
  frameInsetPx?: number;
  onChromePxChange?: (px: number) => void;
};

export default function MagnitudeCanvas({
  selectedSize,
  px,
  background,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
  canvasRef,
  keyContent,
  frameInsetPx,
  onChromePxChange,
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
      keyContent={keyContent}
      frameInsetPx={frameInsetPx}
      onChromePxChange={onChromePxChange}
      canvas={
        <canvas
          ref={refToUse}
          width={selectedSize}
          height={selectedSize}
          className="block h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
      }
    />
  );
}
