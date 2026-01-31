"use client";

import React, { useEffect, useRef } from "react";
import RegalCanvasFrame from "@/components/ui/RegalCanvasFrame";

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

  keyContent?: React.ReactNode;
  frameInsetPx?: number;
  onChromePxChange?: (px: number) => void;
};

const TITLE_GAP = 8;
const KEY_GAP = 8;

export default function SpectrumCanvasBase({
  label,
  canvas,
  background,
  px,
  dragKey,
  onPointerDownHandle,
  onPointerMoveHandle,
  onPointerUpHandle,
  keyContent,
  frameInsetPx = 0,
  onChromePxChange,
}: SpectrumCanvasBaseProps) {
  const inset = Math.round(frameInsetPx);
  const outerPx = Math.round(px);
  const innerPx = Math.max(1, outerPx - 2 * inset);

  const titleRef = useRef<HTMLDivElement | null>(null);
  const keyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onChromePxChange) return;

    const read = () => {
      const titleH = titleRef.current?.getBoundingClientRect().height ?? 0;
      const keyH = keyContent ? (keyRef.current?.getBoundingClientRect().height ?? 0) : 0;

      const chrome =
        titleH + (titleH > 0 ? TITLE_GAP : 0) + (keyContent ? KEY_GAP + keyH : 0);

      onChromePxChange(Math.ceil(chrome));
    };

    read();

    const ro = new ResizeObserver(read);
    if (titleRef.current) ro.observe(titleRef.current);
    if (keyRef.current) ro.observe(keyRef.current);

    return () => ro.disconnect();
  }, [keyContent, onChromePxChange]);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="relative overflow-visible"
        style={{
          width: outerPx,
          height: outerPx,
          clipPath: "inset(-1000px 0px -1000px 0px)", // clip horizontally, allow vertical overlays
        }}
      >
        {/* Title overlay */}

        <div
          ref={titleRef}
          className="absolute inset-x-0 flex justify-center pointer-events-none"
          style={{ top: -TITLE_GAP, transform: "translateY(-100%)" }}
        >
          <div className="max-w-full overflow-hidden text-center">
            <div className="text-md sm:text-md lg:text-lg text-fg font-serif font-semibold whitespace-nowrap text-center">
              {label}
            </div>
          </div>
        </div>

        {/* Square fills wrapper (outer chrome, includes frame) */}
        <div className="absolute inset-0 overflow-visible">
          {/* Frame behind (does NOT block pointer events) */}
          {inset > 0 ? (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <RegalCanvasFrame innerSize={innerPx} frame={Math.max(1, inset)} pad={0} />
            </div>
          ) : null}
          {/* Inset content area (the window) */}
          <div
            className="absolute z-0"
            style={{
              left: inset,
              top: inset,
              width: innerPx,
              height: innerPx,
              background, // keep background behind canvas consistent
            }}
          >
            {canvas}
          </div>
          {/* Resize handle: keep it on the OUTER box */}
          <div
            className="absolute z-20 bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
            title="Drag to resize"
            onPointerDown={(e) => onPointerDownHandle(dragKey, e)}
            onPointerMove={onPointerMoveHandle}
            onPointerUp={onPointerUpHandle}
            onPointerCancel={onPointerUpHandle}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4 opacity-80 text-frame-accent">
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

        {/* Key overlay below square */}
        {keyContent ? (
          <div
            ref={keyRef}
            className="absolute inset-x-0 px-1 pointer-events-none"
            style={{ bottom: -KEY_GAP, transform: "translateY(100%)" }}
          >
            <div className="w-full max-w-full overflow-hidden">{keyContent}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
