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

  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  keyContent?: React.ReactNode;
  frameInsetPx?: number;
  onChromePxChange?: (px: number) => void;
};

export default function PhaseCanvas({
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
      keyContent={keyContent}
      frameInsetPx={frameInsetPx}
      onChromePxChange={onChromePxChange}
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
