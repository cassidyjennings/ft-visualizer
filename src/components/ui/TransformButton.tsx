"use client";

import React from "react";

type TransformButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function TransformButton({ onClick, disabled }: TransformButtonProps) {
  return (
    <button
      aria-label="Transform"
      title="Compute DFT magnitude + phase"
      onClick={onClick}
      disabled={disabled}
      className="
        inline-flex items-center justify-center
        px-2 py-1.5
        rounded-sm
        text-brand
        hover:bg-fg/10
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        transition
      "
    >
      <svg
        viewBox="0 0 24 24"
        className="w-36 h-24 drop-shadow-sm drop-shadow-border"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Shaft ends exactly at arrowhead base */}
        <path d="M 2 12 h16" />
        <path d="M 15 7 l 5 5 -5 5" />
      </svg>
    </button>
  );
}
