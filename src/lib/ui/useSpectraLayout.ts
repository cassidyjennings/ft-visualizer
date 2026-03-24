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

const BASE = 64;
const STACK_MAIN_BREAKPOINT = 1024;
const MIN_DRAW_CANVAS = 256;
const MIN_DRAW_CANVAS_COMPACT = 128;
const MIN_SPEC_CANVAS = 64;
const MIN_SPEC_CANVAS_COMPACT = 48;
const SPECTRA_SPACER_PX = 48;
const INITIAL_MAG_CHROME_PX = 120;
const INITIAL_PHASE_CHROME_PX = 72;
const WIDTH_SAFETY_MARGIN_PX = 16;
const HEIGHT_SAFETY_MARGIN_PX = 24;

type DragState = {
  key: "mag" | "phase";
  startX: number;
  startMagPx: number;
  startPhasePx: number;
} | null;

type Viewport = {
  w: number;
  h: number;
  pageTop: number;
};

export type SpectraLayout = {
  setLayoutRef: (el: HTMLDivElement | null) => void;
  arrowRef: (el: HTMLDivElement | null) => void;
  controlsWrapRef: (el: HTMLDivElement | null) => void;
  rightPanelRef: (el: HTMLDivElement | null) => void;
  leftPanelRef: (el: HTMLDivElement | null) => void;
  spectraPairRef: (el: HTMLDivElement | null) => void;
  displaySize: number;
  drawOuterSize: number;
  isLayoutReady: boolean;
  isSpectraReady: boolean;
  stackMain: boolean;
  stackSpectra: boolean;
  magPx: number;
  phasePx: number;
  startDrag: (key: "mag" | "phase", e: PointerEvent) => void;
  moveDrag: (e: PointerEvent) => void;
  endDrag: () => void;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function useViewportSize(): Viewport {
  const [viewport, setViewport] = useState<Viewport>({
    w: 1200,
    h: 800,
    pageTop: 0,
  });

  useEffect(() => {
    const vv = window.visualViewport;

    const read = () => {
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      const pageTop = (vv?.offsetTop ?? 0) + window.scrollY;

      setViewport({
        w: Math.floor(w),
        h: Math.floor(h),
        pageTop,
      });
    };

    read();
    window.addEventListener("resize", read);
    vv?.addEventListener("resize", read);
    vv?.addEventListener("scroll", read);

    let mq: MediaQueryList | null = null;
    const attachDprListener = () => {
      mq?.removeEventListener?.("change", read);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener?.("change", () => {
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

export function useSpectraLayout(params?: {
  magChromePx?: number;
  phaseChromePx?: number;
  drawOuterChromePx?: number;
}): SpectraLayout {
  const magChromePx = params?.magChromePx ?? 0;
  const phaseChromePx = params?.phaseChromePx ?? 0;
  const drawOuterChromePx = params?.drawOuterChromePx ?? 0;
  const effectiveMagChromePx = Math.max(magChromePx, INITIAL_MAG_CHROME_PX);
  const effectivePhaseChromePx = Math.max(phaseChromePx, INITIAL_PHASE_CHROME_PX);
  const viewport = useViewportSize();

  const layoutNodeRef = useRef<HTMLDivElement | null>(null);
  const spectraPairNodeRef = useRef<HTMLDivElement | null>(null);

  const { ref: layoutMeasureRef, rect: layoutRect } = useMeasure<HTMLDivElement>();
  const { ref: leftPanelRef } = useMeasure<HTMLDivElement>();
  const { ref: arrowRef, rect: arrowRect } = useMeasure<HTMLDivElement>();
  const { ref: controlsWrapRef, rect: controlsRect } = useMeasure<HTMLDivElement>();
  const { ref: rightPanelRef } = useMeasure<HTMLDivElement>();

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

  const rawLayoutWidth = Math.floor(layoutRect.width);
  const rawLayoutTop = Math.max((layoutRect.pageTop || 0) - viewport.pageTop, 0);
  const rawArrowWidth = Math.floor(arrowRect.width || 0);
  const rawControlsHeight = Math.floor(controlsRect.height || 0);
  const layoutWidth = rawLayoutWidth;
  const stackMain = layoutWidth < STACK_MAIN_BREAKPOINT;
  const stackSpectra = false;
  const arrowWidth = rawArrowWidth;
  const drawOuterMin = (stackMain ? BASE : MIN_DRAW_CANVAS) + drawOuterChromePx;

  const minSpectraWidth = stackSpectra
    ? MIN_SPEC_CANVAS
    : 2 * (stackMain ? MIN_SPEC_CANVAS_COMPACT : MIN_SPEC_CANVAS) + specPairGapPx;

  const maxCanvasWidth = stackMain
    ? Math.max(0, layoutWidth - drawOuterChromePx)
    : Math.max(0, layoutWidth - arrowWidth - minSpectraWidth - 2 * gridColGapPx);

  const layoutTopInViewport = rawLayoutTop;
  const bottomSlackPx = Math.ceil(gridRowGapPx + (stackMain ? BASE / 2 : BASE / 8));
  const viewportHeight = viewport.h;
  const remainingViewportHeight = Math.max(
    0,
    viewportHeight - layoutTopInViewport - bottomSlackPx,
  );
  const maxCanvasHeight = stackMain
    ? Math.max(0, remainingViewportHeight - drawOuterChromePx - HEIGHT_SAFETY_MARGIN_PX)
    : Math.max(0, remainingViewportHeight - rawControlsHeight - HEIGHT_SAFETY_MARGIN_PX);

  const availableDisplaySize = Math.floor(
    stackMain ? maxCanvasWidth : Math.min(maxCanvasWidth, maxCanvasHeight),
  );
  const safeDisplaySize = Math.max(0, availableDisplaySize - WIDTH_SAFETY_MARGIN_PX);
  const minDisplay = stackMain
    ? Math.min(MIN_DRAW_CANVAS_COMPACT, Math.max(BASE, safeDisplaySize))
    : MIN_DRAW_CANVAS;
  const idealDisplaySize = clamp(
    safeDisplaySize,
    minDisplay,
    Math.min(maxCanvasHeight, safeDisplaySize),
  );
  const measuredChromeReady = magChromePx > 0 && phaseChromePx > 0;
  const hasStableMeasurements =
    viewport.w > 0 &&
    viewport.h > 0 &&
    rawLayoutWidth > 0 &&
    rawControlsHeight > 0 &&
    rawArrowWidth > 0 &&
    measuredChromeReady;
  const measuredDisplaySize = Math.max(BASE, Math.floor(idealDisplaySize / BASE) * BASE);
  const displaySize = measuredDisplaySize;
  const drawOuterSize = displaySize + drawOuterChromePx;

  const leftW = drawOuterSize;
  const arrowW = Math.floor(arrowRect.width || 0);
  const compactSpectraBudget = Math.max(
    0,
    Math.min(layoutWidth, viewport.w) - 2 * gridColGapPx,
  );
  const spectraBudget = stackMain
    ? compactSpectraBudget
    : Math.max(0, layoutWidth - leftW - arrowW - 2 * gridColGapPx);
  const minSpecCanvas = stackMain ? MIN_SPEC_CANVAS_COMPACT : MIN_SPEC_CANVAS;
  const totalSpectraWidth = Math.max(0, spectraBudget - specPairGapPx);

  const maxMagByHeight = Math.max(
    MIN_SPEC_CANVAS,
    Math.floor(remainingViewportHeight - effectiveMagChromePx - SPECTRA_SPACER_PX),
  );
  const maxPhaseByHeight = Math.max(
    MIN_SPEC_CANVAS,
    Math.floor(remainingViewportHeight - effectivePhaseChromePx - SPECTRA_SPACER_PX),
  );

  const isSpectraReady = stackSpectra
    ? totalSpectraWidth >= minSpecCanvas
    : spectraBudget > 0 &&
      totalSpectraWidth >= 2 * minSpecCanvas &&
      displaySize >= minSpecCanvas;

  const DESKTOP_INITIAL_MAG_FRAC = 0.42;
  const [magFrac, setMagFrac] = useState(DESKTOP_INITIAL_MAG_FRAC);
  const prevStackMain = useRef<boolean | null>(null);

  useEffect(() => {
    const prev = prevStackMain.current;
    prevStackMain.current = stackMain;

    if (prev === null || !prev || stackMain) return;

    const frame = window.requestAnimationFrame(() => {
      setMagFrac(DESKTOP_INITIAL_MAG_FRAC);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [stackMain]);

  let magPx = minSpecCanvas;
  let phasePx = minSpecCanvas;

  if (stackSpectra) {
    const stackedOuter = clamp(
      Math.min(displaySize, totalSpectraWidth, maxMagByHeight, maxPhaseByHeight),
      minSpecCanvas,
      Math.max(minSpecCanvas, Math.min(displaySize, totalSpectraWidth)),
    );
    magPx = stackedOuter;
    phasePx = stackedOuter;
  } else {
    const compactSideMax = Math.max(minSpecCanvas, Math.floor(totalSpectraWidth / 2));
    const maxMagPxAllowed = clamp(
      totalSpectraWidth - minSpecCanvas,
      minSpecCanvas,
      stackMain
        ? Math.min(compactSideMax, maxMagByHeight)
        : Math.min(displaySize, maxMagByHeight),
    );
    const maxPhasePxAllowed = clamp(
      totalSpectraWidth - minSpecCanvas,
      minSpecCanvas,
      stackMain
        ? Math.min(compactSideMax, maxPhaseByHeight)
        : Math.min(displaySize, maxPhaseByHeight),
    );

    magPx = isSpectraReady ? Math.round(magFrac * totalSpectraWidth) : minSpecCanvas;
    magPx = clamp(magPx, minSpecCanvas, maxMagPxAllowed);

    phasePx = isSpectraReady ? totalSpectraWidth - magPx : minSpecCanvas;
    phasePx = clamp(phasePx, minSpecCanvas, maxPhasePxAllowed);

    magPx = isSpectraReady
      ? clamp(totalSpectraWidth - phasePx, minSpecCanvas, maxMagPxAllowed)
      : minSpecCanvas;
  }

  const dragRef = useRef<DragState>(null);

  function startDrag(key: "mag" | "phase", e: PointerEvent) {
    if (!isSpectraReady || stackSpectra) return;

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
    if (!st || !isSpectraReady || stackSpectra) return;

    const dx = e.clientX - st.startX;

    let desiredMagPx =
      st.key === "mag" ? st.startMagPx + dx : totalSpectraWidth - (st.startPhasePx + dx);

    const maxMagPxAllowed = clamp(
      totalSpectraWidth - minSpecCanvas,
      minSpecCanvas,
      stackMain
        ? Math.min(Math.floor(totalSpectraWidth / 2), maxMagByHeight)
        : Math.min(displaySize, maxMagByHeight),
    );
    const maxPhasePxAllowed = clamp(
      totalSpectraWidth - minSpecCanvas,
      minSpecCanvas,
      stackMain
        ? Math.min(Math.floor(totalSpectraWidth / 2), maxPhaseByHeight)
        : Math.min(displaySize, maxPhaseByHeight),
    );

    desiredMagPx = clamp(
      desiredMagPx,
      minSpecCanvas,
      Math.min(maxMagPxAllowed, totalSpectraWidth - minSpecCanvas),
    );

    const minMagGivenPhaseMax = Math.max(
      minSpecCanvas,
      totalSpectraWidth - maxPhasePxAllowed,
    );
    desiredMagPx = Math.max(desiredMagPx, minMagGivenPhaseMax);

    setMagFrac(desiredMagPx / totalSpectraWidth);
  }

  function endDrag() {
    dragRef.current = null;
  }

  const isLayoutReady = useMemo(() => {
    return (
      (layoutRect.width || 0) > 0 &&
      hasStableMeasurements &&
      displaySize >= BASE &&
      drawOuterSize >= drawOuterMin
    );
  }, [
    displaySize,
    drawOuterMin,
    drawOuterSize,
    hasStableMeasurements,
    layoutRect.width,
  ]);

  return {
    setLayoutRef,
    arrowRef,
    controlsWrapRef,
    rightPanelRef,
    leftPanelRef,
    spectraPairRef,
    displaySize,
    drawOuterSize,
    isLayoutReady,
    isSpectraReady,
    stackMain,
    stackSpectra,
    magPx,
    phasePx,
    startDrag,
    moveDrag,
    endDrag,
  };
}
