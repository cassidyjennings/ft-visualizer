"use client";

import { useEffect, useRef, useState } from "react";
import CanvasGrid, { CanvasGridHandle } from "@/components/CanvasGrid";
import CanvasGridControls from "@/components/CanvasGridControls";
import { makeFFTWorker } from "@/lib/workers/fftWorkerClient";
import type { FFTRequest, FFTResponse } from "@/lib/workers/fft.worker";
import type { BrushSettings } from "@/lib/image/brush";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useMeasure } from "@/lib/ui/useMeasure";

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
  const [viewportH, setViewportH] = useState(800);
  const HEADER_H = 56;
  const MAIN_PAD_Y = 24;
  const GAP_CANVAS_CONTROLS = 24;
  const EXTRA_MARGIN = 12;
  const MIN_CANVAS = 220;
  const MAX_CANVAS = Math.floor(viewportH * 0.75);

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const availableH =
    viewportH -
    HEADER_H -
    MAIN_PAD_Y * 2 -
    controlsRect.height -
    GAP_CANVAS_CONTROLS -
    EXTRA_MARGIN;

  // Use left panel width (more accurate than measuring the whole grid)
  const availableW = leftPanelRect.width;

  const canvasDisplaySize = Math.floor(Math.min(availableW, availableH));
  const idealDisplaySize = Math.max(MIN_CANVAS, Math.min(MAX_CANVAS, canvasDisplaySize));

  const BASE = 64;
  const displaySize = Math.max(BASE, Math.floor(idealDisplaySize / BASE) * BASE);

  // ===== Right panel sizing & independent resizing =====
  const rightColH = leftPanelRect.height; // match left height
  const rightColW = leftPanelRect.width; // match left width (grid 1fr)

  const SPEC_GAP = 24;
  const LABEL_H = 24;
  const RIGHT_EXTRA = 12;
  const SPEC_MIN = 64;

  // Total vertical budget for the two square *side lengths* combined
  const totalSquaresH = Math.floor(rightColH - SPEC_GAP - 2 * LABEL_H - RIGHT_EXTRA);
  // Width constraint for each square
  const maxW = Math.floor(rightColW);

  const budgetReady = rightColH > 0 && rightColW > 0 && totalSquaresH >= 2 * SPEC_MIN;

  // Largest one can be if the other is at min (and must also fit width)
  const maxOne = budgetReady
    ? Math.max(SPEC_MIN, Math.min(maxW, totalSquaresH - SPEC_MIN))
    : SPEC_MIN;
  // One degree of freedom: how much of the height budget goes to magnitude
  const [magFrac, setMagFrac] = useState(0.5); // 0..1

  // Convert magFrac -> magPx (then phase fills remainder)
  let magPx = budgetReady ? Math.round(magFrac * totalSquaresH) : SPEC_MIN;
  magPx = clamp(magPx, SPEC_MIN, maxOne);

  const phasePx = budgetReady ? clamp(totalSquaresH - magPx, SPEC_MIN, maxW) : SPEC_MIN;

  // If phase got width-clamped, recompute mag to keep the coupled constraint
  magPx = budgetReady ? clamp(totalSquaresH - phasePx, SPEC_MIN, maxOne) : SPEC_MIN;

  // Fallback size for before measurement exists
  const initialPx = budgetReady
    ? clamp(Math.floor(totalSquaresH / 2), SPEC_MIN, maxOne)
    : SPEC_MIN;

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

  const magCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Update Phase and Magnitude canvases
  useEffect(() => {
    if (!fft) return;
    if (fft.width !== selectedSize || fft.height !== selectedSize) return;

    drawMagnitude(
      magCanvasRef.current,
      fft.real,
      fft.imag,
      selectedSize,
      selectedSize,
      settings.magScale,
    );
    drawPhase(phaseCanvasRef.current, fft.real, fft.imag, selectedSize, selectedSize);
  }, [fft, selectedSize, settings.magScale]);

  // Undo
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
          <button
            aria-label="Transform"
            title="Compute DFT magnitude + phase"
            onClick={handleTransform}
            disabled={isTransforming}
            className="inline-flex items-center justify-center p-4 hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-14 h-14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12h18" />
              <path d="M16 5l6 7-6 7" />
            </svg>
          </button>
        </div>

        {/* RIGHT: Magnitude + Phase displays */}
        <div
          className="min-w-0 flex flex-col items-center"
          style={{ height: rightColH || undefined }}
        >
          <div className="h-full min-h-0 w-full flex flex-col gap-6 items-center">
            {/* Magnitude */}
            <div className="w-full flex flex-col items-center">
              <div className="mb-2 font-medium">Magnitude ({settings.magScale})</div>

              <div
                className="relative"
                style={{ width: magPx || initialPx, height: magPx || initialPx }}
              >
                <canvas
                  ref={magCanvasRef}
                  width={selectedSize}
                  height={selectedSize}
                  className="border bg-black block"
                  style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
                />

                <div
                  className="absolute bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
                  title="Drag to resize magnitude"
                  onPointerDown={(e) => startDrag("mag", e)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
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

            {/* Phase */}
            <div className="w-full flex flex-col items-center">
              <div className="mb-2 font-medium">Phase</div>

              <div
                className="relative"
                style={{ width: phasePx || initialPx, height: phasePx || initialPx }}
              >
                <canvas
                  ref={phaseCanvasRef}
                  width={selectedSize}
                  height={selectedSize}
                  className="border bg-black block"
                  style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
                />

                <div
                  className="absolute bottom-1 right-1 h-5 w-5 rounded cursor-se-resize touch-none flex items-center justify-center"
                  title="Drag to resize phase"
                  onPointerDown={(e) => startDrag("phase", e)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
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

function drawMagnitude(
  canvas: HTMLCanvasElement | null,
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
  scale: "linear" | "log",
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = ctx.createImageData(width, height);

  let maxV = 0;
  const vals = new Float32Array(width * height);

  for (let i = 0; i < vals.length; i++) {
    const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    const v = scale === "log" ? Math.log1p(mag) : mag;
    vals[i] = v;
    if (v > maxV) maxV = v;
  }

  const inv = maxV > 0 ? 1 / maxV : 1;

  for (let i = 0; i < vals.length; i++) {
    const g = Math.floor(255 * clamp(vals[i] * inv, 0, 1));
    const j = i * 4;
    img.data[j + 0] = g;
    img.data[j + 1] = g;
    img.data[j + 2] = g;
    img.data[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}

function drawPhase(
  canvas: HTMLCanvasElement | null,
  real: Float32Array,
  imag: Float32Array,
  width: number,
  height: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = ctx.createImageData(width, height);

  for (let pix_i = 0; pix_i < width * height; pix_i++) {
    const phi = Math.atan2(imag[pix_i], real[pix_i]);
    const t = Math.abs(phi) / Math.PI;

    let r = 0;
    let g = 0;
    let b = 0;

    if (phi > 0) r = Math.round(255 * t);
    else if (phi < 0) b = Math.round(255 * t);

    if (t > 0.999) {
      r = 255;
      g = 255;
      b = 255;
    }

    const j = pix_i * 4;
    img.data[j + 0] = r;
    img.data[j + 1] = g;
    img.data[j + 2] = b;
    img.data[j + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}
