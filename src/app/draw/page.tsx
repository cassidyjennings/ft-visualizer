"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useMeasure } from "@/lib/ui/useMeasure";

import CanvasGrid, { CanvasGridHandle } from "@/components/canvases/CanvasGrid";
import CanvasGridControls from "@/components/ui/CanvasGridControls";
import MagnitudeCanvas from "@/components/canvases/MagnitudeCanvas";
import PhaseCanvas from "@/components/canvases/PhaseCanvas";
import TransformButton from "@/components/ui/TransformButton";

import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";

import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import type { BrushSettings } from "@/lib/image/brush";

/**
 * FFT output for the 2D spectrum canvases.
 * `real` and `imag` are width*height-length arrays in row-major order.
 */
type FFTState = {
  width: number;
  height: number;
  real: Float32Array;
  imag: Float32Array;
} | null;

/** Clamp a number into [lo, hi]. */
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type DragState = {
  key: "mag" | "phase";
  startX: number;
  startMagPx: number;
  startPhasePx: number;
} | null;

export default function DrawPage() {
  const { settings } = useSettings();

  // Refs
  const canvasRef = useRef<CanvasGridHandle | null>(null);
  const workerRef = useRef<Worker | null>(null);
  // Normal ref for reading computed styles + callback ref for measurement
  const layoutNodeRef = useRef<HTMLDivElement | null>(null);
  // Measurements (DOM rectangles)
  const { ref: layoutMeasureRef, rect: layoutRect } = useMeasure<HTMLDivElement>();
  const { ref: arrowRef, rect: arrowRect } = useMeasure<HTMLDivElement>();
  const { ref: controlsWrapRef, rect: controlsRect } = useMeasure<HTMLDivElement>();
  const { ref: rightPanelRef, rect: rightPanelRect } = useMeasure<HTMLDivElement>();
  // Attatch callback and normal ref for layout
  const setLayoutRef = (el: HTMLDivElement | null) => {
    layoutNodeRef.current = el;
    layoutMeasureRef(el);
  };

  // Viewport (fallback before layout is measured)
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  // Initial mount
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // UI states
  const [selectedSize, setSelectedSize] = useState(16);
  const [showGrid, setShowGrid] = useState(true);
  const [brush, setBrush] = useState<BrushSettings>({
    value: 255,
    radius: 0,
    mode: "draw",
    shape: "square",
  });
  const [fft, setFft] = useState<FFTState>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  // ===== CANVAS SIZING =====
  // Layout constants
  const BASE = 64; // Drawing canvas side length must be multiple of BASE
  const MIN_DRAW_CANVAS = 256;
  const MIN_SPEC_CANVAS = 64;

  // Derived gap values
  const [gridColGapPx, setGridColGapPx] = useState(0);
  const [gridRowGapPx, setGridRowGapPx] = useState(0);
  const spectraPairRef = useRef<HTMLDivElement | null>(null);
  const [specPairGapPx, setSpecPairGapPx] = useState(0);
  // Initial mount
  useEffect(() => {
    const update = () => {
      // Grid gaps (from the main layout grid)
      const layoutEl = layoutNodeRef.current;
      if (layoutEl) {
        const cs = getComputedStyle(layoutEl);
        setGridColGapPx(Number.parseFloat(cs.columnGap || "0") || 0);
        setGridRowGapPx(Number.parseFloat(cs.rowGap || "0") || 0);
      }

      // Spectra pair gap (between magnitude and phase)
      const pairEl = spectraPairRef.current;
      if (pairEl) {
        const cs = getComputedStyle(pairEl);
        setSpecPairGapPx(Number.parseFloat(cs.columnGap || "0") || 0);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Find occupied width
  const layoutWidth = Math.floor(layoutRect.width || viewport.w);
  const arrowWidth = Math.floor(arrowRect.width || 0);
  // Reserve enough space for the two spectrum canvases (minimums + their internal gap)
  const minSpectraWidth = 2 * MIN_SPEC_CANVAS + specPairGapPx;
  // Find remaining width
  const maxCanvasWidth = Math.max(
    0,
    layoutWidth - arrowWidth - minSpectraWidth - 2 * gridColGapPx,
  );
  // Find occupied height
  const layoutTopInViewport = layoutRect.top || 0;
  // Small layout-derived slack to help avoid overflow → scrollbar → reflow edge case,
  // especially when we snap the chosen size down to a multiple of BASE
  const bottomSlackPx = Math.ceil(gridRowGapPx + BASE / 8);
  const remainingViewportHeight = Math.max(
    0,
    viewport.h - layoutTopInViewport - bottomSlackPx,
  );
  // Find remaining height
  const maxCanvasHeight = Math.max(
    0,
    remainingViewportHeight - Math.floor(controlsRect.height || 0),
  );
  // Final drawing canvas sizing
  const availableDisplaySize = Math.floor(Math.min(maxCanvasWidth, maxCanvasHeight));
  // Choose an “ideal” size within constraints, then snap down to BASE multiple
  const idealDisplaySize = clamp(
    availableDisplaySize,
    MIN_DRAW_CANVAS,
    Math.min(maxCanvasHeight, availableDisplaySize),
  );
  const displaySize = Math.max(BASE, Math.floor(idealDisplaySize / BASE) * BASE);

  // Spectrum canvas sizing
  const rightPanelWidth = Math.floor(rightPanelRect.width || 0);
  const totalSpectraWidth = Math.max(0, rightPanelWidth - specPairGapPx);
  // Check if we have finalized measurements
  const isSpectraReady =
    rightPanelWidth > 0 &&
    totalSpectraWidth >= 2 * MIN_SPEC_CANVAS &&
    displaySize >= MIN_SPEC_CANVAS;
  // Find max size one of the canvases can be
  const maxOneSide = isSpectraReady
    ? clamp(totalSpectraWidth - MIN_SPEC_CANVAS, MIN_SPEC_CANVAS, displaySize)
    : MIN_SPEC_CANVAS;
  // Find initial sizing to use
  const initialSidePx = isSpectraReady
    ? clamp(Math.floor(totalSpectraWidth / 2), MIN_SPEC_CANVAS, maxOneSide)
    : MIN_SPEC_CANVAS;
  // Track the ratio of magnitude spectrum size to phase spectrum size
  const [magFrac, setMagFrac] = useState(0.5);
  // Compute initial sizes
  let magPx = isSpectraReady ? Math.round(magFrac * totalSpectraWidth) : MIN_SPEC_CANVAS;
  magPx = clamp(magPx, MIN_SPEC_CANVAS, maxOneSide);
  let phasePx = isSpectraReady ? totalSpectraWidth - magPx : MIN_SPEC_CANVAS;
  phasePx = clamp(phasePx, MIN_SPEC_CANVAS, displaySize);
  // Recompute mag after clamping phase so mag+phase fills the budget.
  magPx = isSpectraReady
    ? clamp(totalSpectraWidth - phasePx, MIN_SPEC_CANVAS, maxOneSide)
    : MIN_SPEC_CANVAS;

  // ===== RESIZING SPECTRA CANVASES =====
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

    // Dragging either handle adjusts the implicit split; store it as a fraction of total width.
    let desiredMagPx =
      st.key === "mag" ? st.startMagPx + dx : totalSpectraWidth - (st.startPhasePx + dx);

    desiredMagPx = clamp(desiredMagPx, MIN_SPEC_CANVAS, maxOneSide);
    setMagFrac(desiredMagPx / totalSpectraWidth);
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ===== FFT WORKER =====
  // Initial mount
  useEffect(() => {
    const w = makeFFTWorker();
    workerRef.current = w;

    w.onmessage = (e: MessageEvent<FFTResponse>) => {
      setFft({
        width: e.data.width,
        height: e.data.height,
        real: e.data.real,
        imag: e.data.imag,
      });
      setIsTransforming(false);
    };

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  function handleTransform() {
    const w = workerRef.current;
    const grid = canvasRef.current;
    if (!w || !grid) return;

    setIsTransforming(true);

    const pixels = grid.getImageData();
    const msg: FFTRequest = {
      width: selectedSize,
      height: selectedSize,
      pixels,
      shift: settings.shift === "shifted",
      normalization: settings.normalization,
      center: settings.center,
    };

    w.postMessage(msg, [pixels.buffer]);
  }

  // ===== UNDO DRAWING SHORTCUT =====
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndo) return;
      e.preventDefault();
      canvasRef.current?.undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ===== RENDER GATING =====
  const isLayoutReady = useMemo(() => {
    return (
      (layoutRect.width || 0) > 0 && (controlsRect.height || 0) > 0 && displaySize >= BASE
    );
  }, [layoutRect.width, controlsRect.height, displaySize]);

  return (
    <div className="px-6 sm:px-10 lg:px-14 py-6 space-y-10">
      <div
        ref={setLayoutRef}
        className={[
          "w-full",
          "grid gap-y-6",
          "grid-cols-1",
          "lg:grid-cols-[auto_auto_minmax(0,1fr)]",
          "lg:grid-rows-[auto_auto]",
          "lg:gap-x-6",
          "lg:items-start",
          isLayoutReady ? "opacity-100" : "opacity-0 pointer-events-none select-none",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        {/* Draw canvas */}
        <div
          className="min-w-0 flex flex-col items-start"
          style={{ height: displaySize, width: displaySize }}
        >
          <CanvasGrid
            ref={canvasRef}
            selectedSize={selectedSize}
            brush={brush}
            showGrid={showGrid}
            displaySize={displaySize}
          />
        </div>

        {/* Controls */}
        <div
          ref={controlsWrapRef}
          className="flex justify-start lg:col-start-1 lg:row-start-2"
          style={{ width: displaySize }}
        >
          <CanvasGridControls
            gridRef={canvasRef}
            displaySize={displaySize}
            size={selectedSize}
            setSize={setSelectedSize}
            brush={brush}
            setBrush={setBrush}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
          />
        </div>

        {/* Transform button + hint */}
        <div
          ref={arrowRef}
          className="flex flex-col items-center lg:col-start-2 lg:row-start-1 lg:self-center"
        >
          {/* Spacer keeps the button vertically centered even when hint text hides. */}
          <div className="mt-2 max-w-[18rem] text-center text-sm text-white/70 invisible">
            Invisible Spacer
          </div>

          <TransformButton onClick={handleTransform} disabled={isTransforming} />

          <div
            className={[
              "mt-2 max-w-[18rem] text-center text-sm text-white/70",
              fft ? "invisible" : "visible",
            ].join(" ")}
            aria-hidden={!!fft}
          >
            Click <span className="font-large text-white"> ➜ </span> to compute the DFT.
          </div>
        </div>

        {/* Spectra */}
        <div
          ref={rightPanelRef}
          className="min-w-0 flex items-center justify-end lg:col-start-3 lg:row-start-1 lg:self-center"
          style={{ height: displaySize }}
        >
          <div className="inline-flex items-center gap-6">
            <MagnitudeCanvas
              fft={fft}
              selectedSize={selectedSize}
              px={magPx || initialSidePx}
              scale={settings.magScale}
              onPointerDownHandle={(key, e) => startDrag(key, e)}
              onPointerMoveHandle={moveDrag}
              onPointerUpHandle={endDrag}
            />

            <PhaseCanvas
              fft={fft}
              selectedSize={selectedSize}
              px={phasePx || initialSidePx}
              onPointerDownHandle={(key, e) => startDrag(key, e)}
              onPointerMoveHandle={moveDrag}
              onPointerUpHandle={endDrag}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
