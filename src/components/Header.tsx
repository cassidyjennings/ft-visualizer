"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import type {
  CenterConvention,
  FFTNormalization,
  MagScale,
  ShiftConvention,
} from "@/lib/settings/types";

const nav = [{ href: "/draw", label: "2D Draw" }];

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group relative px-1 py-2 text-base sm:text-lg lg:text-xl transition font-serif font-semibold",
        active ? "text-fg" : "text-fg/70 hover:text-fg",
      ].join(" ")}
    >
      {label}
      {/* underline bar */}
      <span
        className={[
          "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300",
          active ? "w-full bg-brand-2" : "w-0 bg-fg/0 group-hover:w-full",
        ].join(" ")}
      />
    </Link>
  );
}

// Bigger, clearer gear (Heroicons-style)
function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="200"
      height="200"
      viewBox="0 0 416 432"
      className={className}
    >
      <path d="m366 237l45 35q7 6 3 14l-43 74q-4 8-13 4l-53-21q-18 13-36 21l-8 56q-1 9-11 9h-85q-9 0-11-9l-8-56q-19-8-36-21l-53 21q-9 3-13-4L1 286q-4-8 3-14l45-35q-1-12-1-21t1-21L4 160q-7-6-3-14l43-74q5-8 13-4l53 21q18-13 36-21l8-56q2-9 11-9h85q10 0 11 9l8 56q19 8 36 21l53-21q9-3 13 4l43 74q4 8-3 14l-45 35q2 12 2 21t-2 21zm-158.5 54q30.5 0 52.5-22t22-53t-22-53t-52.5-22t-52.5 22t-22 53t22 53t52.5 22z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { settings, setSettings } = useSettings();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  // Click-outside to close dropdown/mobile panel
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;

      if (dropdownOpen && dropdownRef.current && t && !dropdownRef.current.contains(t)) {
        setDropdownOpen(false);
      }
      if (
        mobileOpen &&
        mobilePanelRef.current &&
        t &&
        !mobilePanelRef.current.contains(t)
      ) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [dropdownOpen, mobileOpen]);

  const selectClass =
    "mt-1 w-full rounded-md border border-border/10 bg-muted px-2 py-1.5 text-sm text-fg outline-none " +
    "focus:border-border/25 focus:ring-1 focus:ring-fg/15";

  const labelClass = "text-xs font-medium text-fg/70";

  const quick = useMemo(
    () => ({
      center: settings.center,
      shift: settings.shift,
      magScale: settings.magScale,
      normalization: settings.normalization,
    }),
    [settings.center, settings.shift, settings.magScale, settings.normalization],
  );

  const isSettingsPage = pathname === "/settings";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex min-h-17.5 w-full items-center justify-between px-6 ">
        {/* Left: title */}
        <h1 className="min-w-0 truncate text-3xl sm:text-2xl lg:text-3xl text-fg font-serif">
          <Link
            href="/"
            className="flex items-center gap-5"
            onClick={() => {
              setMobileOpen(false);
              setDropdownOpen(false);
            }}
          >
            <Image
              src="/silly-fourier-square.png"
              alt="Fourier’s Playground logo"
              width={60}
              height={60}
              priority
              className="select-none"
            />
            <span>Fourier’s Playground</span>
          </Link>
        </h1>

        {/* Right: ALL nav + settings aligned together */}
        <div className="ml-auto flex items-center gap-6">
          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 px-12">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                onClick={() => {
                  setMobileOpen(false);
                  setDropdownOpen(false);
                }}
              />
            ))}
          </nav>
          {/* Settings dropdown trigger (no outline, underline when on /settings) */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((v) => !v)}
              className={[
                "relative px-1 py-2 text-fg/70 hover:text-fg transition",
                dropdownOpen ? "text-fg" : "",
              ].join(" ")}
              title="Settings"
            >
              <span className="inline-flex items-center gap-2">
                <GearIcon className="h-7 w-7 fill-brand-2 " />
              </span>

              {/* underline bar (selected when on settings page) */}
              <span
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300",
                  isSettingsPage ? "w-full bg-fg" : "w-0 bg-fg/0",
                ].join(" ")}
              />
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 top-11 z-50 w-85 rounded-md border border-fg/10 bg-bg p-4 shadow-lg "
              >
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <div className={labelClass}>Canvas Origin</div>
                    <select
                      className={selectClass}
                      value={quick.center}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          center: e.target.value as CenterConvention,
                        }))
                      }
                    >
                      <option value="centerPixel">Bottom-right center pixel</option>
                      <option value="centerBetween">Between middle pixels</option>
                      <option value="topLeft">Top-left pixel</option>
                    </select>
                  </div>

                  <div>
                    <div className={labelClass}>DFT shift</div>
                    <select
                      className={selectClass}
                      value={quick.shift}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          shift: e.target.value as ShiftConvention,
                        }))
                      }
                    >
                      <option value="shifted">Shifted (DC centered)</option>
                      <option value="unshifted">Unshifted (DC at top-left)</option>
                    </select>
                  </div>

                  <div>
                    <div className={labelClass}>Magnitude Scale</div>
                    <select
                      className={selectClass}
                      value={quick.magScale}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          magScale: e.target.value as MagScale,
                        }))
                      }
                    >
                      <option value="linear">Linear</option>
                      <option value="log">Log (log1p)</option>
                    </select>
                  </div>

                  <div>
                    <div className={labelClass}>Normalization</div>
                    <select
                      className={selectClass}
                      value={quick.normalization}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          normalization: e.target.value as FFTNormalization,
                        }))
                      }
                    >
                      <option value="forward">Forward (1/N)</option>
                      <option value="inverse">Inverse (1/N)</option>
                      <option value="unitary">Unitary (1/√N on both)</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/settings"
                      className="block w-full rounded-md bg-fg/5 px-3 py-2 text-center text-sm text-fg/80 hover:bg-fg/10 hover:text-fg transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Open full settings
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center text-fg/80 hover:text-fg transition"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay + panel */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-bg/50" />
          <div
            ref={mobilePanelRef}
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-fg/10 bg-bg/90 p-4 shadow-xl backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="truncate font-semibold tracking-tight text-lg text-fg"
                onClick={() => setMobileOpen(false)}
              >
                Fourier Transform Visualizer
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center text-fg/80 hover:text-fg transition"
                onClick={() => setMobileOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-2 text-lg text-fg/80 hover:text-fg"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 text-lg text-fg/80 hover:text-fg"
              >
                Settings
              </Link>
            </div>

            <div className="mt-6 border-t border-fg/10 pt-4 text-xs text-fg/60">
              Tip: use the gear icon for quick settings.
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
