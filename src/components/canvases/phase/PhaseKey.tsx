"use client";

export default function PhaseKey({ className = "" }: { className?: string }) {
  const gradient = `
    linear-gradient(
      90deg,
      rgb(255,255,255) 0%,
      rgb(128,128,223) 12.5%,
      rgb(0,0,128)     25%,
      rgb(0,0,64)      37.5%,
      rgb(0,0,0)       50%,
      rgb(64,0,0)      62.5%,
      rgb(128,0,0)     75%,
      rgb(223,128,128) 87.5%,
      rgb(255,255,255) 100%
    )
  `;

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
      <div className="grid min-w-0 grid-cols-[1fr_auto] gap-4">
        <div className="min-w-0 grid grid-rows-2">
          <div
            className="h-[60%] w-full shadow rounded-full border border-border"
            style={{ background: gradient }}
            aria-label="Phase color key from −π to +π"
          />
          <div className="flex w-full justify-between text-md text-fg/70 min-w-0">
            <span>−π</span>
            <span>−j</span>
            <span>0</span>
            <span>+j</span>
            <span>+π</span>
          </div>
        </div>

        {/* Allow this column to shrink, and protect the text */}
        <div className="min-w-0 grid grid-rows-2">
          <div
            className="h-4 w-full shadow border border-border bg-null"
            aria-label="Color key for undefined phase"
          />
          <div className="flex w-full min-w-0 items-center justify-center text-sm text-fg/70">
            <span className="min-w-0 truncate">Undefined</span>
          </div>
        </div>
      </div>
    </div>
  );
}
