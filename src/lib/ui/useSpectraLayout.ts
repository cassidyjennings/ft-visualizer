// src/lib/ui/useSpectraLayout.ts
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { useMeasure } from "@/lib/ui/useMeasure";

// ===== Constants =====
const BASE = 64;
const MIN_DRAW_CANVAS = 256;
const MIN_SPEC_CANVAS = 64;

// ===== Types =====
type DragState = {
  key: "mag" | "phase";
  startX: number;
  startMagPx: number;
  startPhasePx: number;
} | null;

type Viewport = { w: number; h: number };

export type SpectraLayout = {
  // Measurement and computed gaps
  setLayoutRef: (el: HTMLDivElement | null) => void;

  // For arrow width budgeting
  arrowRef: (el: HTMLDivElement | null) => void;

  // For controls + canvas height budgeting
  controlsWrapRef: (el: HTMLDivElement | null) => void;

  // For spectra width budgeting
  rightPanelRef: (el: HTMLDivElement | null) => void;

  // For reading columnGap
  spectraPairRef: (el: HTMLDivElement | null) => void;

  // Final draw canvas display size (px), snapped to BASE multiple
  displaySize: number;

  // True when we have enough measurements to render
  isLayoutReady: boolean;

  // True when right panel is measured enough to do spectra sizing/dragging
  isSpectraReady: boolean;

  // Computed pixel widths for each spectrum canvas.
  magPx: number;
  phasePx: number;

  // Drag handlers for the magnitude/phase resizer handles.
  startDrag: (key: "mag" | "phase", e: PointerEvent) => void;
  moveDrag: (e: PointerEvent) => void;
  endDrag: () => void;
};

// ===== Helpers =====
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function useViewportSize(): Viewport {
  const [viewport, setViewport] = useState<Viewport>({ w: 1200, h: 800 });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}

/**
 * Computes:
 * - draw canvas display size (snapped to BASE)
 * - magnitude/phase spectra sizes with constraints
 * - drag interaction to change the split
 */
export function useSpectraLayout(): SpectraLayout {
  const viewport = useViewportSize();

  // DOM nodes for getComputedStyle
  const layoutNodeRef = useRef<HTMLDivElement | null>(null);
  const spectraPairNodeRef = useRef<HTMLDivElement | null>(null);

  // Measurements (rects)
  const { ref: layoutMeasureRef, rect: layoutRect } = useMeasure<HTMLDivElement>();
  const { ref: arrowRef, rect: arrowRect } = useMeasure<HTMLDivElement>();
  const { ref: controlsWrapRef, rect: controlsRect } = useMeasure<HTMLDivElement>();
  const { ref: rightPanelRef, rect: rightPanelRect } = useMeasure<HTMLDivElement>();

  const setLayoutRef = useCallback(
    (el: HTMLDivElement | null) => {
      layoutNodeRef.current = el;
      layoutMeasureRef(el);
    },
    [layoutMeasureRef],
  );

  const spectraPairRef = useCallback((el: HTMLDivElement | null) => {
    spectraPairNodeRef.current = el;
  }, []);

  // Computed CSS gaps (keeps math aligned with Tailwind/CSS)
  const [gridColGapPx, setGridColGapPx] = useState(0);
  const [gridRowGapPx, setGridRowGapPx] = useState(0);
  const [specPairGapPx, setSpecPairGapPx] = useState(0);

  useEffect(() => {
    const update = () => {
      const layoutEl = layoutNodeRef.current;
      if (layoutEl) {
        const cs = getComputedStyle(layoutEl);
        setGridColGapPx(Number.parseFloat(cs.columnGap || "0") || 0);
        setGridRowGapPx(Number.parseFloat(cs.rowGap || "0") || 0);
      }

      const pairEl = spectraPairNodeRef.current;
      if (pairEl) {
        const cs = getComputedStyle(pairEl);
        setSpecPairGapPx(Number.parseFloat(cs.columnGap || "0") || 0);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ===== Draw canvas sizing =====
  const layoutWidth = Math.floor(layoutRect.width || viewport.w);
  const arrowWidth = Math.floor(arrowRect.width || 0);

  // Reserve enough width for the two spectrum canvases (minimums + their internal gap)
  const minSpectraWidth = 2 * MIN_SPEC_CANVAS + specPairGapPx;

  const maxCanvasWidth = Math.max(
    0,
    layoutWidth - arrowWidth - minSpectraWidth - 2 * gridColGapPx,
  );

  const layoutTopInViewport = layoutRect.top || 0;
  const bottomSlackPx = Math.ceil(gridRowGapPx + BASE / 8);

  const remainingViewportHeight = Math.max(
    0,
    viewport.h - layoutTopInViewport - bottomSlackPx,
  );
  const maxCanvasHeight = Math.max(
    0,
    remainingViewportHeight - Math.floor(controlsRect.height || 0),
  );

  const availableDisplaySize = Math.floor(Math.min(maxCanvasWidth, maxCanvasHeight));
  const idealDisplaySize = clamp(
    availableDisplaySize,
    MIN_DRAW_CANVAS,
    Math.min(maxCanvasHeight, availableDisplaySize),
  );

  const displaySize = Math.max(BASE, Math.floor(idealDisplaySize / BASE) * BASE);

  // ===== Spectra sizing =====
  const rightPanelWidth = Math.floor(rightPanelRect.width || 0);
  const totalSpectraWidth = Math.max(0, rightPanelWidth - specPairGapPx);

  const isSpectraReady =
    rightPanelWidth > 0 &&
    totalSpectraWidth >= 2 * MIN_SPEC_CANVAS &&
    displaySize >= MIN_SPEC_CANVAS;

  const maxOneSide = isSpectraReady
    ? clamp(totalSpectraWidth - MIN_SPEC_CANVAS, MIN_SPEC_CANVAS, displaySize)
    : MIN_SPEC_CANVAS;

  // Track split as fraction for stability under resize
  const [magFrac, setMagFrac] = useState(0.5);

  // Convert fraction to constrained px
  let magPx = isSpectraReady ? Math.round(magFrac * totalSpectraWidth) : MIN_SPEC_CANVAS;
  magPx = clamp(magPx, MIN_SPEC_CANVAS, maxOneSide);

  let phasePx = isSpectraReady ? totalSpectraWidth - magPx : MIN_SPEC_CANVAS;
  phasePx = clamp(phasePx, MIN_SPEC_CANVAS, displaySize);

  // Recompute mag after clamping phase so mag+phase fills budget.
  magPx = isSpectraReady
    ? clamp(totalSpectraWidth - phasePx, MIN_SPEC_CANVAS, maxOneSide)
    : MIN_SPEC_CANVAS;
  // ===== Drag interaction =====
  const dragRef = useRef<DragState>(null);

  function startDrag(key: "mag" | "phase", e: PointerEvent) {
    if (!isSpectraReady) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      key,
      startX: e.clientX,
      startMagPx: magPx,
      startPhasePx: phasePx,
    };
  }

  function moveDrag(e: PointerEvent) {
    const st = dragRef.current;
    if (!st || !isSpectraReady) return;

    const dx = e.clientX - st.startX;

    let desiredMagPx =
      st.key === "mag" ? st.startMagPx + dx : totalSpectraWidth - (st.startPhasePx + dx);

    desiredMagPx = clamp(desiredMagPx, MIN_SPEC_CANVAS, maxOneSide);
    setMagFrac(desiredMagPx / totalSpectraWidth);
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ===== Render gating =====
  const isLayoutReady = useMemo(() => {
    return (
      (layoutRect.width || 0) > 0 && (controlsRect.height || 0) > 0 && displaySize >= BASE
    );
  }, [layoutRect.width, controlsRect.height, displaySize]);

  return {
    setLayoutRef,
    arrowRef,
    controlsWrapRef,
    rightPanelRef,
    spectraPairRef,
    displaySize,
    isLayoutReady,
    isSpectraReady,
    magPx,
    phasePx,
    startDrag,
    moveDrag,
    endDrag,
  };
}
