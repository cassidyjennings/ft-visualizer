// // "use client";

// // import { CssVariable } from "next/dist/compiled/@next/font";
// // import React from "react";

// // export type SpectrumKey = "mag" | "phase";

// // type SpectrumCanvasBaseProps<K extends SpectrumKey> = {
// //   label: React.ReactNode;

// //   // canvas sizing
// //   selectedSize: number; // bitmap size
// //   px: number; // CSS square size

// //   background: string;

// //   // the canvas element comes from children (MagnitudeCanvas / PhaseCanvas)
// //   canvas: React.ReactNode;

// //   // resize handle wiring (logic stays in DrawPage)
// //   dragKey: K;
// //   onPointerDownHandle: (key: K, e: React.PointerEvent) => void;
// //   onPointerMoveHandle: (e: React.PointerEvent) => void;
// //   onPointerUpHandle: () => void;

// //   handleTitle: string;
// // };

// // export default function SpectrumCanvasBase<K extends SpectrumKey>({
// //   label,
// //   px,
// //   background,
// //   canvas,
// //   dragKey,
// //   onPointerDownHandle,
// //   onPointerMoveHandle,
// //   onPointerUpHandle,
// //   handleTitle,
// // }: SpectrumCanvasBaseProps<K>) {
// //   return (
// //     <div className="w-full flex flex-col items-center">
// //       <div className="mb-2 text-md sm:text-md lg:text-lg text-fg font-serif font-semibold">
// //         {label}
// //       </div>

// //       <div
// //         className="relative shadow-lg border-2 border-fg"
// //         style={{ width: px, height: px, background: background }}
// //       >
// //         {canvas}

// //         <div
// //           className="absolute bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
// //           title={handleTitle}
// //           onPointerDown={(e) => onPointerDownHandle(dragKey, e)}
// //           onPointerMove={onPointerMoveHandle}
// //           onPointerUp={onPointerUpHandle}
// //           onPointerCancel={onPointerUpHandle}
// //         >
// //           <svg viewBox="0 0 16 16" className="h-4 w-4 opacity-80">
// //             <path
// //               d="M6 14L14 6"
// //               stroke="currentColor"
// //               strokeWidth="1.5"
// //               strokeLinecap="round"
// //             />
// //             <path
// //               d="M9 14L14 9"
// //               stroke="currentColor"
// //               strokeWidth="1.5"
// //               strokeLinecap="round"
// //             />
// //             <path
// //               d="M12 14L14 12"
// //               stroke="currentColor"
// //               strokeWidth="1.5"
// //               strokeLinecap="round"
// //             />
// //           </svg>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// "use client";

// import React, { useEffect } from "react";

// export type SpectrumKey = "mag" | "phase";

// type SpectrumCanvasBaseProps = {
//   label: React.ReactNode;
//   spectrumRef: React.RefObject<HTMLCanvasElement | null>;
//   canvas: React.ReactNode;
//   background: string;

//   selectedSize: number; // bitmap size
//   px: number; // CSS square size

//   dragKey: SpectrumKey;
//   onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
//   onPointerMoveHandle: (e: React.PointerEvent) => void;
//   onPointerUpHandle: () => void;
// };

// export default function SpectrumCanvasBase({
//   label,
//   spectrumRef,
//   canvas,
//   background,
//   px,
//   dragKey,
//   onPointerDownHandle,
//   onPointerMoveHandle,
//   onPointerUpHandle,
// }: SpectrumCanvasBaseProps) {
//   useEffect(() => {
//     const ctx = spectrumRef.current?.getContext("2d");
//     if (!ctx) return;

//     if (!fft) {
//       // fill with empty color
//       ctx.fillStyle = background; // bg for magnitude, null for phase
//       ctx.fillRect(0, 0, px, px);
//       return;
//     }

//     // otherwise render from fft.real/fft.imag
//   }, [fft, background, px, spectrumRef]);

//   return (
//     <div className="w-full flex flex-col items-center">
//       <div className="mb-2 text-md sm:text-md lg:text-lg text-fg font-serif font-semibold">
//         {label}
//       </div>

//       <div
//         className="relative shadow-lg border-2 border-brand-3"
//         style={{ width: px, height: px, background: background }}
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

import React from "react";

export type SpectrumKey = "mag" | "phase";

type SpectrumCanvasBaseProps = {
  label: React.ReactNode;
  spectrumRef: React.RefObject<HTMLCanvasElement | null>;
  canvas: React.ReactNode;
  background: string;

  selectedSize: number;
  px: number;

  dragKey: SpectrumKey;
  onPointerDownHandle: (key: SpectrumKey, e: React.PointerEvent) => void;
  onPointerMoveHandle: (e: React.PointerEvent) => void;
  onPointerUpHandle: () => void;
};

export default function SpectrumCanvasBase({
  label,
  canvas,
  background,
  px,
  dragKey,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
}: SpectrumCanvasBaseProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-2 text-md sm:text-md lg:text-lg text-fg font-serif font-semibold">
        {label}
      </div>

      <div
        className="relative shadow-lg border-2 border-brand-3"
        style={{ width: px, height: px, background }}
      >
        {canvas}

        <div
          className="absolute bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
          title="Drag to resize"
          onPointerDown={(e) => onPointerDownHandle(dragKey, e)}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onPointerCancel={onPointerUpHandle}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4 opacity-80">
            <path
              d="M6 14L14 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M9 14L14 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 14L14 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
