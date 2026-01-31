"use client";

import React, { useMemo } from "react";
import type { MagnitudeStats } from "@/lib/fft/draw";

function invDisplayToMag(displayV: number, scale: "linear" | "log") {
  return scale === "log" ? Math.expm1(displayV) : displayV;
}

function gcd(a: number, b: number) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

function reduceFraction(num: number, den: number) {
  if (num === 0) return { num: 0, den: 1 };
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

type TickLabel = 0 | 1 | { num: number; den: number } | null;

function labelKey(v: TickLabel) {
  if (v === null) return "—";
  if (v === 0) return "0";
  if (v === 1) return "1";
  return `${v.num}/${v.den}`;
}

function computeAdaptiveLabels(
  ticks: readonly number[],
  maxMag: number,
  baseDen: number,
  maxUpscales = 12,
): TickLabel[] {
  let den = baseDen;

  for (let k = 0; k <= maxUpscales; k++) {
    const labels: TickLabel[] = ticks.map((t) => {
      if (t === 0) return 0;

      const num = Math.round(t * maxMag * den);
      const r = reduceFraction(num, den);

      if (r.num === r.den) return 1;
      return r;
    });

    // detect adjacent duplicates (what you complained about)
    const keys = labels.map(labelKey);
    let hasDup = false;
    for (let i = 0; i < keys.length - 1; i++) {
      if (keys[i] === keys[i + 1]) {
        hasDup = true;
        break;
      }
    }

    if (!hasDup) return labels;

    den *= 2; // increase precision and retry
  }

  // fallback: best effort at max precision
  const denFinal = baseDen * Math.pow(2, maxUpscales);
  return ticks.map((t) => {
    if (t === 0) return 0;
    const num = Math.round(t * maxMag * denFinal);
    const r = reduceFraction(num, denFinal);
    if (r.num === r.den) return 1;
    return r;
  });
}

const Fraction = ({
  numerator,
  denominator,
  className = "",
}: {
  numerator: number;
  denominator: number;
  className?: string;
}) => {
  return (
    <span
      className={[
        "inline-flex flex-col items-center justify-center text-center align-middle mx-0.5",
        "tabular-nums text-[11px] text-fg leading-tight",
        className,
      ].join(" ")}
    >
      <span className="border-b border-fg/70 px-0.5">{numerator}</span>
      <span className="opacity-80">{denominator}</span>
    </span>
  );
};

export default function MagnitudeKey({
  stats,
  isDark,
  className = "",
}: {
  stats: MagnitudeStats | null;
  isDark: boolean;
  className?: string;
}) {
  const ticks = useMemo(() => [0, 0.25, 0.5, 0.75, 1] as const, []);

  const gradient = isDark
    ? "linear-gradient(to right, #000, #fff)"
    : "linear-gradient(to right, #fff, #000)";

  // compute labels (or placeholders) in one place so render matches PhaseKey height
  const labels: TickLabel[] = (() => {
    if (!stats) return ticks.map((t) => (t === 0 ? 0 : t === 1 ? 1 : null));

    const N = stats.n;
    const totalN = N * N;
    const baseDen = totalN * 4;

    const rawMaxMag =
      stats.normalize === "max"
        ? invDisplayToMag(stats.maxV, stats.scale)
        : invDisplayToMag(1, stats.scale);

    const maxMag = rawMaxMag > 0 ? rawMaxMag : 1;

    return computeAdaptiveLabels(ticks, maxMag, baseDen, 12);
  })();

  return (
    <div
      className={[
        "min-w-0 shadow overflow-hidden",
        "rounded-xl border border-border",
        "bg-card/80",
        "p-2 sm:p-3",
        className,
      ].join(" ")}
    >
      <div className="min-w-0 grid grid-rows-2">
        <div
          className="h-[60%] w-full shadow rounded-full border border-border"
          style={{ background: gradient }}
          aria-label="Magnitude grayscale key"
        />

        <div className="flex w-full justify-between text-fg/70 min-w-0 -mt-0.5 -mb-0.5">
          {labels.map((v, idx) => {
            if (v === null)
              return (
                <span key={idx}>
                  <Fraction numerator={0} denominator={1} />
                </span>
              );

            if (v === 0 || v === 1) {
              return (
                <span key={idx} className="tabular-nums text-md">
                  {v}
                </span>
              );
            }

            return (
              <span key={idx} className="min-w-0">
                <Fraction numerator={v.num} denominator={v.den} />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
