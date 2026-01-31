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

type Viewport = { w: number; h: number; scale: number; dpr: number };

export type SpectraLayout = {
  // Measurement and computed gaps
  setLayoutRef: (el: HTMLDivElement | null) => void;

  // For arrow width budgeting
  arrowRef: (el: HTMLDivElement | null) => void;

  // For controls + canvas height budgeting
  controlsWrapRef: (el: HTMLDivElement | null) => void;

  // For spectra width budgeting
  rightPanelRef: (el: HTMLDivElement | null) => void;
  leftPanelRef: (el: HTMLDivElement | null) => void;

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
  const [viewport, setViewport] = useState<Viewport>({
    w: 1200,
    h: 800,
    scale: 1,
    dpr: 1,
  });

  useEffect(() => {
    const vv = window.visualViewport;

    const read = () => {
      // visualViewport is the “real” viewport under zoom (when supported)
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      const scale = vv?.scale ?? 1;
      const dpr = window.devicePixelRatio || 1;

      setViewport({
        w: Math.floor(w),
        h: Math.floor(h),
        scale,
        dpr,
      });
    };

    read();

    // Regular resize (window size changes)
    window.addEventListener("resize", read);

    // Zoom + on-screen keyboard + mobile chrome bar changes often appear here
    vv?.addEventListener("resize", read);
    vv?.addEventListener("scroll", read);

    // DPR often changes when zoom changes. This pattern lets you re-run when it does.
    let mq: MediaQueryList | null = null;
    const attachDprListener = () => {
      mq?.removeEventListener?.("change", read);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener?.("change", () => {
        // When DPR changes, the query itself is stale; rebuild it.
        attachDprListener();
        read();
      });
    };
    attachDprListener();

    return () => {
      window.removeEventListener("resize", read);
      vv?.removeEventListener("resize", read);
      vv?.removeEventListener("scroll", read);
      mq?.removeEventListener?.("change", read);
    };
  }, []);

  return viewport;
}

/**
 * Computes:
 * - draw canvas display size (snapped to BASE)
 * - magnitude/phase spectra sizes with constraints
 * - drag interaction to change the split
 */
export function useSpectraLayout(params?: {
  magChromePx?: number;
  phaseChromePx?: number;
}): SpectraLayout {
  const magChromePx = params?.magChromePx ?? 0;
  const phaseChromePx = params?.phaseChromePx ?? 0;
  const viewport = useViewportSize();

  // DOM nodes for getComputedStyle
  const layoutNodeRef = useRef<HTMLDivElement | null>(null);
  const spectraPairNodeRef = useRef<HTMLDivElement | null>(null);

  // Measurements (rects)
  const { ref: layoutMeasureRef, rect: layoutRect } = useMeasure<HTMLDivElement>();
  const { ref: leftPanelRef, rect: leftPanelRect } = useMeasure<HTMLDivElement>();
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
        const gap = cs.gap || cs.columnGap || "0";
        setSpecPairGapPx(Number.parseFloat(gap) || 0);
      }
    };

    const vv = window.visualViewport;

    update();
    window.addEventListener("resize", update);
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
    };
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
  const leftW = Math.floor(
    Math.max(leftPanelRect.width || 0, controlsRect.width || 0, displaySize),
  );

  const arrowW = Math.floor(arrowRect.width || 0);

  // This is the true width available for the RIGHT column (spectra),
  // after accounting for the left panel + middle arrow + both grid gaps.
  const spectraBudget = Math.max(0, layoutWidth - leftW - arrowW - 2 * gridColGapPx);

  // Now split that between mag + phase (minus their internal gap)
  const totalSpectraWidth = Math.max(0, spectraBudget - specPairGapPx);

  // Height available for the spectra *components* (not just the square)
  // We clamp the square so that: square + chrome <= remainingViewportHeight
  const maxMagByHeight = Math.max(
    MIN_SPEC_CANVAS,
    Math.floor(remainingViewportHeight - magChromePx),
  );

  const maxPhaseByHeight = Math.max(
    MIN_SPEC_CANVAS,
    Math.floor(remainingViewportHeight - phaseChromePx),
  );

  const isSpectraReady =
    spectraBudget > 0 &&
    totalSpectraWidth >= 2 * MIN_SPEC_CANVAS &&
    displaySize >= MIN_SPEC_CANVAS;

  // Each side’s max is limited by:
  // - available width (other side at least MIN_SPEC_CANVAS)
  // - displaySize (don’t exceed draw canvas scale)
  // - its own height budget (remainingViewportHeight - chrome)
  const maxMagPxAllowed = isSpectraReady
    ? clamp(
        totalSpectraWidth - MIN_SPEC_CANVAS,
        MIN_SPEC_CANVAS,
        Math.min(displaySize, maxMagByHeight),
      )
    : MIN_SPEC_CANVAS;

  const maxPhasePxAllowed = isSpectraReady
    ? clamp(
        totalSpectraWidth - MIN_SPEC_CANVAS,
        MIN_SPEC_CANVAS,
        Math.min(displaySize, maxPhaseByHeight),
      )
    : MIN_SPEC_CANVAS;

  // Track split as fraction for stability under resize
  const [magFrac, setMagFrac] = useState(0.5);

  // Convert fraction -> px, then clamp by per-side limits
  let magPx = isSpectraReady ? Math.round(magFrac * totalSpectraWidth) : MIN_SPEC_CANVAS;
  magPx = clamp(magPx, MIN_SPEC_CANVAS, maxMagPxAllowed);

  let phasePx = isSpectraReady ? totalSpectraWidth - magPx : MIN_SPEC_CANVAS;
  phasePx = clamp(phasePx, MIN_SPEC_CANVAS, maxPhasePxAllowed);

  // Recompute mag after clamping phase so mag+phase fills width budget.
  magPx = isSpectraReady
    ? clamp(totalSpectraWidth - phasePx, MIN_SPEC_CANVAS, maxMagPxAllowed)
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

    // compute desiredMag from drag direction
    let desiredMagPx =
      st.key === "mag" ? st.startMagPx + dx : totalSpectraWidth - (st.startPhasePx + dx);

    // Clamp mag, but also ensure phase can still be >= MIN_SPEC_CANVAS
    desiredMagPx = clamp(
      desiredMagPx,
      MIN_SPEC_CANVAS,
      Math.min(maxMagPxAllowed, totalSpectraWidth - MIN_SPEC_CANVAS),
    );

    // Additionally respect phase's own max by preventing mag from forcing phase too big.
    // If phase has a max, then mag must be at least total - maxPhase.
    const minMagGivenPhaseMax = Math.max(
      MIN_SPEC_CANVAS,
      totalSpectraWidth - maxPhasePxAllowed,
    );
    desiredMagPx = Math.max(desiredMagPx, minMagGivenPhaseMax);

    setMagFrac(desiredMagPx / totalSpectraWidth);
  }

  function endDrag() {
    dragRef.current = null;
  }

  useEffect(() => {
    // dev-only
    if (process.env.NODE_ENV === "production") return;

    const L = Math.floor(layoutRect.width || viewport.w);
    const colGap = Math.floor(gridColGapPx);

    const col1 = Math.floor(
      Math.max(leftPanelRect.width || 0, controlsRect.width || 0, displaySize),
    );
    const col2 = Math.floor(arrowRect.width || 0);
    const col3_measured = Math.floor(rightPanelRect.width || 0);

    // what col3 SHOULD be if grid tracks are respecting everything
    const col3_expected = Math.max(0, L - col1 - col2 - 2 * colGap);

    // compare expected + measured + total
    const sum_expected = col1 + col2 + col3_expected + 2 * colGap;
    const sum_measured = col1 + col2 + col3_measured + 2 * colGap;

    const info = {
      layoutWidth: L,
      gridColGapPx: colGap,
      col1_draw: Math.floor(leftPanelRect.width || 0),
      col1_controls: Math.floor(controlsRect.width || 0),
      col1_track_used: col1,
      col2_arrow: col2,
      col3_measured: col3_measured,
      col3_expected: col3_expected,
      sum_expected_tracks_plus_gaps: sum_expected,
      sum_measured_tracks_plus_gaps: sum_measured,
      expectedResidual: L - sum_expected,
      measuredResidual: L - sum_measured,
      spectraBudget_used: Math.max(0, L - col1 - col2 - 2 * colGap),
      specPairGapPx: Math.floor(specPairGapPx),
    };

    // Nice compact readout
    // eslint-disable-next-line no-console
    console.table(info);
  }, [
    layoutRect.width,
    viewport.w,
    gridColGapPx,
    leftPanelRect.width,
    controlsRect.width,
    arrowRect.width,
    rightPanelRect.width,
    displaySize,
    specPairGapPx,
  ]);

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
    leftPanelRef,
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
