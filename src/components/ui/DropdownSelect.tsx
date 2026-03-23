"use client";

import * as React from "react";
import cx from "clsx";

type Option<T extends string> = {
  value: T;
  label: React.ReactNode;
};

type DropdownSelectProps<T extends string> = {
  label?: React.ReactNode;

  value: T;
  onChange: (value: T) => void;

  options: Option<T>[];

  className?: string;
  selectClassName?: string;
};

export function DropdownSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  selectClassName,
}: DropdownSelectProps<T>) {
  return (
    <div className={className}>
      {label && <span className="text-fg text-sm font-medium font-serif">{label}</span>}

      <select
        className={cx(
          "border border-border/40 rounded bg-bg/30 px-2 w-full text-sm font-sans",
          selectClassName,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
