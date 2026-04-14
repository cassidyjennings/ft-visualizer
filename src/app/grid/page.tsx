"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";

import CanvasGrid, { type CanvasGridHandle } from "@/components/canvases/CanvasGrid";
import CanvasGridControls from "@/components/ui/CanvasGridControls";
import MagnitudeCanvas from "@/components/canvases/magnitude/MagnitudeCanvas";
import PhaseCanvas from "@/components/canvases/phase/PhaseCanvas";
import TransformButton from "@/components/ui/TransformButton";
import PhaseKey from "@/components/canvases/phase/PhaseKey";
import MagnitudeKey from "@/components/canvases/magnitude/MagnitudeKey";

import type { BrushSettings } from "@/lib/image/brush";
import { useEffectiveColoring } from "@/lib/settings/useEffectiveColoring";
import { useSpectraLayout } from "@/lib/ui/useSpectraLayout";
import { useFftPipeline } from "@/lib/fft/useFftPipeline";

const DRAW_FRAME_THICKNESS = 14;
const DRAW_FRAME_PAD = 2;
const DRAW_OUTER_CHROME = 2 * (DRAW_FRAME_THICKNESS + DRAW_FRAME_PAD);

function canonicalizePixelsForFFT(pixels: Uint8Array, isDark: boolean) {
  if (isDark) return pixels;
  const out = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i];
    out[i] = v === 0 ? 255 : v === 255 ? 0 : v;
  }
  return out;
}

export default function Grid2DPage() {
  const { settings } = useSettings();
  const effectiveTheme = useEffectiveColoring(settings.coloring);
  const isDark = effectiveTheme === "dark";

  const canvasGridRef = useRef<CanvasGridHandle | null>(null);
  const phaseRef = useRef<HTMLCanvasElement | null>(null);
  const magRef = useRef<HTMLCanvasElement | null>(null);

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

  const SPEC_FRAME_INSET = 10;

  const prevIsDarkRef = useRef(isDark);
  useEffect(() => {
    const prev = prevIsDarkRef.current;
    if (prev === isDark) return;

    prevIsDarkRef.current = isDark;
    setBrushUI((b) => ({ ...b, value: 255 - b.value }));
    canvasGridRef.current?.invertColors?.();
  }, [isDark]);

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

  const {
    setLayoutRef,
    controlsWrapRef,
    arrowRef,
    rightPanelRef,
    leftPanelRef,
    spectraPairRef,
    displaySize,
    drawOuterSize,
    isLayoutReady,
    stackMain,
    magPx,
    phasePx,
    startDrag,
    moveDrag,
    endDrag,
  } = useSpectraLayout({
    magChromePx,
    phaseChromePx,
    drawOuterChromePx: DRAW_OUTER_CHROME,
  });
  const gridOuterSize = drawOuterSize;

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
    clearSpectra();

    if (hasTransformed) {
      recompute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  useEffect(() => {
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

  function handleTransform() {
    setHasTransformed(true);
    transform();
  }

  function handleClear() {
    const grid = canvasGridRef.current;
    if (!grid) return;

    grid.clear();
    clearSpectra();
    requestAnimationFrame(() => recompute());
  }

  return (
    <div className="px-6 py-3 sm:px-10 lg:px-12">
      <div
        ref={setLayoutRef}
        className={[
          "w-full",
          "grid gap-y-7 gap-x-6",
          "grid-cols-1",
          stackMain
            ? ""
            : "lg:grid-cols-[auto_auto_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:items-start",
          isLayoutReady
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none select-none",
          "transition-opacity duration-150",
        ].join(" ")}
        aria-hidden={!isLayoutReady}
      >
        <div
          ref={leftPanelRef}
          className={[
            "min-w-0 flex flex-col",
            stackMain ? "items-center" : "items-start",
          ].join(" ")}
          style={{ width: gridOuterSize, height: gridOuterSize }}
        >
          <CanvasGrid
            ref={canvasGridRef}
            selectedSize={selectedSize}
            brush={brushUI}
            showGrid={showGrid}
            displaySize={displaySize}
            frameThickness={DRAW_FRAME_THICKNESS}
            framePad={DRAW_FRAME_PAD}
          />
        </div>

        <div
          ref={controlsWrapRef}
          className={[
            "flex",
            stackMain ? "justify-center" : "justify-start",
            stackMain ? "" : "lg:col-start-1 lg:row-start-2",
          ].join(" ")}
          style={{ width: gridOuterSize }}
        >
          <CanvasGridControls
            isDark={isDark}
            gridRef={canvasGridRef}
            handleClear={handleClear}
            outerSize={gridOuterSize}
            size={selectedSize}
            setSize={setSelectedSize}
            brush={brushUI}
            onBrushChange={setBrushUI}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
          />
        </div>

        <div
          ref={arrowRef}
          className={[
            "flex flex-col items-center",
            stackMain ? "" : "lg:col-start-2 lg:row-start-1 lg:self-center",
          ].join(" ")}
        >
          <div className="mt-2 max-w-[18rem] text-center text-sm text-fg/70 invisible">
            Spacer
          </div>
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
            Click <span className="font-large font-serif text-brand">{"\u279c"}</span> to
            transform.
          </div>
        </div>

        <div
          ref={rightPanelRef}
          className={[
            "min-w-0 flex overflow-visible",
            stackMain
              ? "items-start justify-center"
              : "items-center justify-center lg:col-start-3 lg:row-start-1 lg:self-center",
          ].join(" ")}
          style={{ height: stackMain ? undefined : displaySize }}
        >
          <div
            ref={spectraPairRef}
            className={[
              "inline-flex gap-6",
              stackMain ? "flex-row items-start justify-center" : "items-center",
            ].join(" ")}
          >
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
                showResizeHandle
              />
            </div>

            <div className="flex flex-col items-stretch">
              <span className="invisible text-3xl">Invisible Spacer</span>
              <PhaseCanvas
                selectedSize={selectedSize}
                px={phasePx}
                background="white"
                canvasRef={phaseRef}
                keyContent={<PhaseKey />}
                frameInsetPx={SPEC_FRAME_INSET}
                onChromePxChange={setPhaseChromePx}
                onPointerDownHandle={(key, e) => startDrag(key, e)}
                onPointerMoveHandle={moveDrag}
                onPointerUpHandle={endDrag}
                showResizeHandle
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
