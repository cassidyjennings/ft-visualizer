"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useMeasure } from "@/lib/ui/useMeasure";

import CanvasGrid, { CanvasGridHandle } from "@/components/CanvasGrid";
import CanvasGridControls from "@/components/CanvasGridControls";
import MagnitudeCanvas from "@/components/MagnitudeCanvas";
import PhaseCanvas from "@/components/PhaseCanvas";
import TransformButton from "@/components/TransformButton";

import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";

import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import type { BrushSettings } from "@/lib/image/brush";

type FFTState = {
  width: number;
  height: number;
  real: Float32Array;
  imag: Float32Array;
} | null;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function DrawPage() {
  const { ref: leftPanelRef, rect: leftPanelRect } = useMeasure<HTMLDivElement>();
  const { ref: controlsRef, rect: controlsRect } = useMeasure<HTMLDivElement>();
  const { settings } = useSettings();

  // ===== Left canvas display sizing =====
  // Derived from CSS
  const HEADER_H = 56;
  const MAIN_PAD_Y = 24;
  const GAP_CANVAS_CONTROLS = 24;
  const EXTRA_MARGIN = 12;
  const MIN_CANVAS = 220;

  const [viewportH, setViewportH] = useState(800);

  const availableH =
    viewportH -
    HEADER_H -
    MAIN_PAD_Y * 2 -
    controlsRect.height -
    GAP_CANVAS_CONTROLS -
    EXTRA_MARGIN;
  // Use left panel width (more accurate than measuring the whole grid)
  const availableW = leftPanelRect.width;

  const availableDisplaySize = Math.floor(Math.min(availableW, availableH));
  const idealDisplaySize = Math.max(
    MIN_CANVAS,
    Math.min(Math.floor(viewportH * 0.75), availableDisplaySize),
  );
  const BASE = 64;
  const displaySize = Math.max(BASE, Math.floor(idealDisplaySize / BASE) * BASE);

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ===== Right panel sizing & independent resizing =====
  const rightColH = leftPanelRect.height; // match left height
  const rightColW = leftPanelRect.width; // match left width (grid 1fr)

  // Derived from CSS
  const SPEC_GAP = 24;
  const LABEL_H = 24;
  const RIGHT_EXTRA = 12;
  const SPEC_MIN = 64;

  // Total vertical budget for the magnitude and phase canvases
  const totalSquaresH = Math.floor(rightColH - SPEC_GAP - 2 * LABEL_H - RIGHT_EXTRA);
  // Width constraint for each square
  const maxW = Math.floor(rightColW);
  const budgetReady = rightColH > 0 && rightColW > 0 && totalSquaresH >= 2 * SPEC_MIN;

  // Largest a spectrum canvas can be if the other is at min (and must also fit width)
  const maxOne = budgetReady
    ? Math.max(SPEC_MIN, Math.min(maxW, totalSquaresH - SPEC_MIN))
    : SPEC_MIN;

  // Fallback size for before measurement exists
  const initialPx = budgetReady
    ? clamp(Math.floor(totalSquaresH / 2), SPEC_MIN, maxOne)
    : SPEC_MIN;

  // One degree of freedom: how much of the height budget goes to magnitude
  const [magFrac, setMagFrac] = useState(0.5); // [0, 1]
  // Convert magFrac to magPx (then phase fills remainder)
  let magPx = budgetReady ? Math.round(magFrac * totalSquaresH) : SPEC_MIN;
  magPx = clamp(magPx, SPEC_MIN, maxOne);
  const phasePx = budgetReady ? clamp(totalSquaresH - magPx, SPEC_MIN, maxW) : SPEC_MIN;
  // If phase got width-clamped, recompute mag to keep the coupled constraint
  magPx = budgetReady ? clamp(totalSquaresH - phasePx, SPEC_MIN, maxOne) : SPEC_MIN;

  // Generic drag state: remembers which plot we are resizing
  const dragRef = useRef<{
    key: "mag" | "phase";
    startX: number;
    startY: number;
    startMagPx: number;
    startPhasePx: number;
  } | null>(null);

  function startDrag(key: "mag" | "phase", e: React.PointerEvent) {
    if (!budgetReady) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      key,
      startX: e.clientX,
      startY: e.clientY,
      startMagPx: magPx,
      startPhasePx: phasePx,
    };
  }

  function moveDrag(e: React.PointerEvent) {
    const st = dragRef.current;
    if (!st || !budgetReady) return;

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    // corner-resize feel
    const d = Math.max(dx, dy);

    // Dragging mag handle means mag tries to grow by d.
    // Dragging phase handle means phase tries to grow by d -> mag shrinks.
    let desiredMagPx =
      st.key === "mag" ? st.startMagPx + d : totalSquaresH - (st.startPhasePx + d);

    desiredMagPx = clamp(desiredMagPx, SPEC_MIN, maxOne);

    // Store as fraction (0..1); derived sizes update automatically
    setMagFrac(desiredMagPx / totalSquaresH);
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ===== FFT plumbing =====
  const canvasRef = useRef<CanvasGridHandle | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Draw canvas settings
  const [selectedSize, setSize] = useState(16);
  const [showGrid, setShowGrid] = useState(true);
  const [brush, setBrush] = useState<BrushSettings>({
    value: 255,
    radius: 0,
    mode: "draw",
    shape: "square",
  });

  const [fft, setFft] = useState<FFTState>(null);
  const [isTransforming, setIsTransforming] = useState(false);

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

  // Initialize FFT worker
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

  // Add ctrl+z event listener
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

  return (
    <div className="space-y-6">
      <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
        {/* LEFT: Canvas + drawing controls */}
        <div ref={leftPanelRef} className="min-w-0 flex flex-col items-center">
          <CanvasGrid
            ref={canvasRef}
            selectedSize={selectedSize}
            brush={brush}
            showGrid={showGrid}
            displaySize={displaySize}
          />

          <div ref={controlsRef} className="mt-6 w-full max-w-140 flex justify-center">
            <CanvasGridControls
              gridRef={canvasRef}
              size={selectedSize}
              setSize={setSize}
              brush={brush}
              setBrush={setBrush}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
            />
          </div>
        </div>

        {/* MIDDLE: Arrow transform button */}
        <div className="flex justify-center">
          <TransformButton onClick={handleTransform} disabled={isTransforming} />
        </div>

        {/* RIGHT: Magnitude + Phase displays */}
        <div
          className="min-w-0 flex flex-col items-center"
          style={{ height: rightColH || undefined }}
        >
          <div className="h-full min-h-0 w-full flex flex-col gap-6 items-center">
            <MagnitudeCanvas
              fft={fft}
              selectedSize={selectedSize}
              px={magPx || initialPx}
              scale={settings.magScale}
              onPointerDownHandle={(key, e) => startDrag(key, e)}
              onPointerMoveHandle={moveDrag}
              onPointerUpHandle={endDrag}
            />

            <PhaseCanvas
              fft={fft}
              selectedSize={selectedSize}
              px={phasePx || initialPx}
              onPointerDownHandle={(key, e) => startDrag(key, e)}
              onPointerMoveHandle={moveDrag}
              onPointerUpHandle={endDrag}
            />

            {!fft && (
              <div className="text-sm text-white/70">
                Click <span className="font-medium text-white">Transform</span> to compute
                the DFT.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
