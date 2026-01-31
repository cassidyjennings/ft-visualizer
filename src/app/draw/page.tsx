"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";

import CanvasGrid, { type CanvasGridHandle } from "@/components/canvases/CanvasGrid";
import CanvasGridControls from "@/components/ui/CanvasGridControls";
import MagnitudeCanvas from "@/components/canvases/MagnitudeCanvas";
import PhaseCanvas from "@/components/canvases/PhaseCanvas";
import TransformButton from "@/components/ui/TransformButton";
import PhaseKey from "@/components/ui/PhaseKey";
import MagnitudeKey from "@/components/ui/MagnitudeKey";

import type { BrushSettings } from "@/lib/image/brush";
import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";
import { useSpectraLayout } from "@/lib/ui/useSpectraLayout";
import { useFftPipeline } from "@/lib/fft/useFftPipeline";

/** Convert the theme-dependent on-canvas pixels to a stable representation for FFT. */
function canonicalizePixelsForFFT(pixels: Uint8Array, isDark: boolean) {
  if (isDark) return pixels;
  const out = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i];
    out[i] = v === 0 ? 255 : v === 255 ? 0 : v;
  }
  return out;
}

export default function DrawPage() {
  const { settings } = useSettings();
  const effectiveTheme = useEffectiveColoring(settings.coloring);
  const isDark = effectiveTheme === "dark";

  // ===== Refs =====
  const canvasGridRef = useRef<CanvasGridHandle | null>(null);
  const phaseRef = useRef<HTMLCanvasElement | null>(null);
  const magRef = useRef<HTMLCanvasElement | null>(null);

  // ===== UI state =====
  const [selectedSize, setSelectedSize] = useState(16);
  const [showGrid, setShowGrid] = useState(true);
  const [hasTransformed, setHasTransformed] = useState(false);

  const [brushUI, setBrushUI] = useState<BrushSettings>(() => ({
    radius: 0,
    mode: "draw",
    shape: "square",
    value: isDark ? 255 : 0,
  }));

  const phaseEmpty = "var(--null)";
  const magEmpty = useMemo(() => (isDark ? "black" : "white"), [isDark]);

  const [magChromePx, setMagChromePx] = useState(0);
  const [phaseChromePx, setPhaseChromePx] = useState(0);

  // Frame inset: spectra should be "smaller" than draw
  const SPEC_FRAME_INSET = 10; // tweak

  // ===== Theme flip sync (brush + canvas) =====
  const prevIsDarkRef = useRef(isDark);
  useEffect(() => {
    const prev = prevIsDarkRef.current;
    if (prev === isDark) return;

    prevIsDarkRef.current = isDark;

    // Flip currently-selected brush value
    setBrushUI((b) => ({ ...b, value: 255 - b.value }));

    // Flip pixels + undo history on draw canvas
    canvasGridRef.current?.invertColors?.();
  }, [isDark]);

  // Ctrl/Cmd+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (!isUndo) return;
      e.preventDefault();
      canvasGridRef.current?.undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ===== Layout + drag logic =====
  const {
    setLayoutRef,
    controlsWrapRef,
    arrowRef,
    rightPanelRef,
    leftPanelRef,
    spectraPairRef,
    displaySize,
    isLayoutReady,
    magPx,
    phasePx,
    startDrag,
    moveDrag,
    endDrag,
  } = useSpectraLayout({ magChromePx, phaseChromePx });
  const [gridOuterSize, setGridOuterSize] = useState<number>(displaySize);

  useEffect(() => {
    const v = canvasGridRef.current?.getOuterSize?.();
    if (typeof v === "number") setGridOuterSize(v);
  }, [displaySize, selectedSize, showGrid]);

  // ===== FFT pipeline =====
  const { isTransforming, transform, recompute, clearSpectra, magStats } = useFftPipeline(
    {
      selectedSize,
      isDark,
      settings: {
        shift: settings.shift,
        normalization: settings.normalization,
        center: settings.center,
        magScale: settings.magScale,
        magNormalize: settings.magNormalize,
      },
      gridRef: canvasGridRef,
      phaseCanvasRef: phaseRef,
      magCanvasRef: magRef,
      phaseEmpty,
      magEmpty,
      canonicalizePixels: canonicalizePixelsForFFT,
    },
  );

  useEffect(() => {
    // Always repaint the empty spectra backgrounds when theme flips,
    // so they don't stay stuck from the initial (pre-hydration) draw.
    clearSpectra();

    // If the user already transformed, redraw the actual spectra too.
    if (hasTransformed) {
      recompute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  useEffect(() => {
    // Only recompute once the user has transformed at least once
    if (!hasTransformed) return;
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.normalization,
    settings.shift,
    settings.center,
    settings.magScale,
    settings.magNormalize,
  ]);

  // ===== Handlers =====
  function handleTransform() {
    setHasTransformed(true);
    transform();
  }

  function handleClear() {
    const grid = canvasGridRef.current;
    if (!grid) return;

    grid.clear();

    // repaint empties immediately for responsiveness
    clearSpectra();

    // wait a frame so grid state is actually cleared before recompute
    requestAnimationFrame(() => recompute());
  }

  return (
    <div className="px-6 sm:px-10 lg:px-12 py-3 space-y-10">
      <div
        ref={setLayoutRef}
        className={[
          "w-full",
          "grid gap-y-7 gap-x-6",
          "grid-cols-1",
          "lg:grid-cols-[auto_auto_minmax(0,1fr)]",
          "lg:grid-rows-[auto_auto]",
          "lg:items-start",
          isLayoutReady ? "opacity-100" : "opacity-0 pointer-events-none select-none",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        {/* Draw canvas */}
        <div
          ref={leftPanelRef}
          className="min-w-0 flex flex-col items-start"
          style={{ height: displaySize, width: displaySize }}
        >
          <CanvasGrid
            ref={canvasGridRef}
            selectedSize={selectedSize}
            brush={brushUI}
            showGrid={showGrid}
            displaySize={displaySize}
          />
        </div>

        {/* Controls */}
        <div
          ref={controlsWrapRef}
          className="flex justify-start lg:col-start-1 lg:row-start-2"
          style={{ width: gridOuterSize }}
        >
          <CanvasGridControls
            isDark={isDark}
            gridRef={canvasGridRef}
            handleClear={handleClear}
            displaySize={displaySize}
            outerSize={gridOuterSize}
            size={selectedSize}
            setSize={setSelectedSize}
            brush={brushUI}
            onBrushChange={setBrushUI}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
          />
        </div>

        {/* Transform button + hint */}
        <div
          ref={arrowRef}
          className="flex flex-col items-center lg:col-start-2 lg:row-start-1 lg:self-center"
        >
          <div className="mt-2 max-w-[18rem] text-center text-sm text-fg/70 invisible">
            Spacer
          </div>

          <TransformButton onClick={handleTransform} disabled={isTransforming} />

          <div
            className={[
              "mt-2 max-w-[18rem] text-center text-sm font-serif text-fg/85",
              hasTransformed ? "invisible" : "visible",
            ].join(" ")}
            aria-hidden={hasTransformed}
          >
            Click <span className="font-large font-serif text-brand"> ➜ </span> to
            transform.
          </div>
        </div>

        {/* Spectra */}
        <div
          ref={rightPanelRef}
          className="min-w-0 flex items-center justify-end lg:col-start-3 lg:row-start-1 lg:self-center"
          style={{ height: displaySize }}
        >
          <div ref={spectraPairRef} className="inline-flex items-center gap-6">
            {/* Magnitude */}
            <div className="flex flex-col items-stretch">
              <span className="invisible text-3xl">Invisible Spacer</span>
              <MagnitudeCanvas
                selectedSize={selectedSize}
                px={magPx}
                background={magEmpty}
                canvasRef={magRef}
                keyContent={
                  <MagnitudeKey
                    key={settings.normalization}
                    stats={magStats}
                    isDark={isDark}
                  />
                }
                frameInsetPx={SPEC_FRAME_INSET}
                onChromePxChange={setMagChromePx}
                onPointerDownHandle={(key, e) => startDrag(key, e)}
                onPointerMoveHandle={moveDrag}
                onPointerUpHandle={endDrag}
              />
            </div>

            {/* Phase */}
            <div className="flex flex-col items-stretch">
              <span className="invisible text-3xl">Invisible Spacer</span>
              <PhaseCanvas
                selectedSize={selectedSize}
                px={phasePx}
                background={"white"}
                canvasRef={phaseRef}
                keyContent={<PhaseKey />}
                frameInsetPx={SPEC_FRAME_INSET}
                onChromePxChange={setPhaseChromePx}
                onPointerDownHandle={(key, e) => startDrag(key, e)}
                onPointerMoveHandle={moveDrag}
                onPointerUpHandle={endDrag}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
