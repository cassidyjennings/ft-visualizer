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
  );
}
