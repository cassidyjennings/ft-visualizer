"use client";

import React, { useId } from "react";

type RegalFrameDetail = "standard" | "ornate";

type RegalFrameProps = {
  innerSize: number;
  frame?: number;
  pad?: number;
  r?: number;
  className?: string;
  detail?: RegalFrameDetail;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function RegalCanvasFrame({
  innerSize,
  frame = 22,
  pad = 2,
  r = 0,
  className,
  detail = "standard",
}: RegalFrameProps) {
  const uid = useId().replace(/:/g, "");
  const f = Math.round(frame);
  const p = Math.round(pad);
  const inner = Math.round(innerSize);
  const ornate = detail === "ornate";

  const s = inner + 2 * (f + p);
  const bandX = p;
  const bandY = p;
  const bandW = inner + 2 * f;
  const bandH = inner + 2 * f;
  const winX = p + f;
  const winY = p + f;

  const outerInset = 0.5;
  const middleInset = clamp(Math.round(f * 0.2), 2, Math.max(2, f - 7));
  const innerInset = clamp(Math.round(f * 0.42), 4, Math.max(4, f - 4));
  const echoInset = clamp(Math.round(f * 0.3), 4, Math.max(4, f - 5));
  const windowInset = f - 0.5;
  const bracketInset = clamp(Math.round(f * 0.22), 3, 8);
  const bracketSize = clamp(Math.round(f * 0.88), 10, 24);
  const medallion = clamp(Math.round(f * 0.28), 3, 8);
  const tick = clamp(Math.round(f * 0.38), 7, 16);
  const maskId = `frame-mask-${uid}`;

  const corners = [
    { key: "tl", x: bandX + bracketInset, y: bandY + bracketInset, sx: 1, sy: 1 },
    {
      key: "tr",
      x: bandX + bandW - bracketInset,
      y: bandY + bracketInset,
      sx: -1,
      sy: 1,
    },
    {
      key: "bl",
      x: bandX + bracketInset,
      y: bandY + bandH - bracketInset,
      sx: 1,
      sy: -1,
    },
    {
      key: "br",
      x: bandX + bandW - bracketInset,
      y: bandY + bandH - bracketInset,
      sx: -1,
      sy: -1,
    },
  ];

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width={s} height={s} fill="black" />
          <rect x={bandX} y={bandY} width={bandW} height={bandH} fill="white" rx={r} ry={r} />
          <rect x={winX} y={winY} width={inner} height={inner} fill="black" />
        </mask>
      </defs>

      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill="var(--frame-primary)"
        mask={`url(#${maskId})`}
      />

      <rect
        x={bandX}
        y={bandY}
        width={bandW}
        height={bandH}
        rx={r}
        ry={r}
        fill="none"
        stroke="var(--frame-trim)"
        strokeWidth="1"
        opacity="0.78"
        mask={`url(#${maskId})`}
      />

      <rect
        x={bandX + outerInset}
        y={bandY + outerInset}
        width={bandW - 2 * outerInset}
        height={bandH - 2 * outerInset}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        mask={`url(#${maskId})`}
      />

      <rect
        x={bandX + middleInset}
        y={bandY + middleInset}
        width={bandW - 2 * middleInset}
        height={bandH - 2 * middleInset}
        fill="none"
        stroke="var(--frame-accent)"
        strokeWidth={ornate ? 1.6 : 1.3}
        opacity={ornate ? 0.78 : 0.52}
        mask={`url(#${maskId})`}
      />

      {ornate ? (
        <>
          <rect
            x={bandX + echoInset}
            y={bandY + echoInset}
            width={bandW - 2 * echoInset}
            height={bandH - 2 * echoInset}
            fill="none"
            stroke="var(--frame-trim)"
            strokeWidth="1.1"
            opacity="0.55"
            mask={`url(#${maskId})`}
          />
          <rect
            x={bandX + innerInset}
            y={bandY + innerInset}
            width={bandW - 2 * innerInset}
            height={bandH - 2 * innerInset}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.72"
            mask={`url(#${maskId})`}
          />
        </>
      ) : null}

      <rect
        x={bandX + windowInset}
        y={bandY + windowInset}
        width={bandW - 2 * windowInset}
        height={bandH - 2 * windowInset}
        fill="none"
        stroke="var(--frame-trim)"
        strokeWidth="1"
        opacity="0.85"
        mask={`url(#${maskId})`}
      />

      {corners.map((corner) => (
        <g
          key={corner.key}
          transform={`translate(${corner.x} ${corner.y}) scale(${corner.sx} ${corner.sy})`}
          mask={`url(#${maskId})`}
        >
          <path
            d={`M0 ${bracketSize} L0 0 L${bracketSize} 0`}
            fill="none"
            stroke="var(--frame-accent)"
            strokeWidth={ornate ? 1.9 : 1.5}
            opacity={ornate ? 0.82 : 0.62}
            strokeLinecap="round"
          />
          {ornate ? (
            <>
              <circle
                cx={medallion}
                cy={medallion}
                r={medallion}
                fill="none"
                stroke="var(--frame-trim)"
                strokeWidth="1"
                opacity="0.58"
              />
              <circle
                cx={medallion}
                cy={medallion}
                r={Math.max(2, medallion - 2)}
                fill="none"
                stroke="var(--frame-accent)"
                strokeWidth="1"
                opacity="0.42"
              />
            </>
          ) : null}
        </g>
      ))}

      {ornate ? (
        <>
          <path
            d={`M${bandX + bandW / 2 - tick} ${bandY + middleInset} H${bandX + bandW / 2 + tick}`}
            stroke="var(--frame-trim)"
            strokeWidth="1"
            opacity="0.46"
            strokeLinecap="round"
            mask={`url(#${maskId})`}
          />
          <path
            d={`M${bandX + bandW / 2 - tick} ${bandY + bandH - middleInset} H${bandX + bandW / 2 + tick}`}
            stroke="var(--frame-trim)"
            strokeWidth="1"
            opacity="0.46"
            strokeLinecap="round"
            mask={`url(#${maskId})`}
          />
          <path
            d={`M${bandX + middleInset} ${bandY + bandH / 2 - tick} V${bandY + bandH / 2 + tick}`}
            stroke="var(--frame-trim)"
            strokeWidth="1"
            opacity="0.46"
            strokeLinecap="round"
            mask={`url(#${maskId})`}
          />
          <path
            d={`M${bandX + bandW - middleInset} ${bandY + bandH / 2 - tick} V${bandY + bandH / 2 + tick}`}
            stroke="var(--frame-trim)"
            strokeWidth="1"
            opacity="0.46"
            strokeLinecap="round"
            mask={`url(#${maskId})`}
          />
        </>
      ) : null}
    </svg>
  );
}
