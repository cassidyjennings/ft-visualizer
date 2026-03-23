"use client";

import * as React from "react";
import cx from "clsx";

type SelectOptionProps = {
  id?: string;

  checked: boolean;
  onCheckedChange: (checked: boolean) => void;

  label: React.ReactNode;
  selectedPreview: React.ReactNode;
  unselectedPreview: React.ReactNode;

  disabled?: boolean;
  className?: string;
};

export function CheckboxOption({
  id,
  checked,
  onCheckedChange,
  label,
  selectedPreview,
  unselectedPreview,
  disabled = false,
  className,
}: SelectOptionProps) {
  const preview = checked ? selectedPreview : unselectedPreview;

  return (
    <div className={cx("flex gap-3", disabled ? "disabled" : "", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className={cx(
          "mt-0.5 h-4 w-4 shrink-0 rounded",
          "accent-brand-2",
          "focus:outline-none focus:ring-offset-background",
        )}
      />

      <div className="min-w-0">
        <div className="text-sm font-medium text-fg">{label}</div>
        <div
          className={cx(
            "mt-1 text-xs leading-snug",

            checked ? "text-fg/70" : "text-fg/70",
          )}
        >
          {preview}
        </div>
      </div>
    </div>
  );
}
