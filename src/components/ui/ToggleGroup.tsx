export function ToggleGroup({
  children,
  height,
  className = "",
}: {
  children: React.ReactNode;
  height: number; // px
  className?: string;
}) {
  return (
    <div
      className={[
        "inline-flex overflow-hidden border border-fg/20 rounded",
        "min-w-0",
        className,
      ].join(" ")}
      style={{ height }}
    >
      {children}
    </div>
  );
}

export function ToggleItem({
  active,
  onClick,
  padX = 12,
  title,
  isFirst,
  grow,
  className = "",
  children,
}: {
  active: boolean;
  onClick: () => void;
  padX?: number;
  title?: string;
  isFirst?: boolean;
  grow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      style={{ paddingInline: padX }}
      className={[
        "inline-flex items-center justify-center",
        "h-full min-w-0",
        grow ? "flex-1 basis-0" : "",
        "bg-card hover:bg-fg/10 active:scale-[0.98] transition",
        active ? "bg-fg/15" : "",
        isFirst ? "" : "border-l border-fg/20",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
