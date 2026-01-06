"use client";

import React from "react";

export type SpectrumKey = "mag" | "phase";

type SpectrumCanvasBaseProps<K extends SpectrumKey> = {
  label: React.ReactNode;

  // canvas sizing
  selectedSize: number; // bitmap size
  px: number; // CSS square size

  // the canvas element comes from children (MagnitudeCanvas / PhaseCanvas)
  canvas: React.ReactNode;

  // resize handle wiring (logic stays in DrawPage)
  dragKey: K;
  onPointerDownHandle: (key: K, e: React.PointerEvent) => void;
  onPointerMoveHandle: (e: React.PointerEvent) => void;
  onPointerUpHandle: () => void;

  handleTitle: string;
};

export default function SpectrumCanvasBase<K extends SpectrumKey>({
  label,
  px,
  canvas,
  dragKey,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
  handleTitle,
}: SpectrumCanvasBaseProps<K>) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-2 font-medium">{label}</div>

      <div className="relative" style={{ width: px, height: px }}>
        {canvas}

        <div
          className="absolute bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
          title={handleTitle}
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
