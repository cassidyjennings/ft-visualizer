"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";
import type {
  Axis1DOrigin,
  CenterConvention,
  DisplayColoring,
  MagNormalize,
} from "@/lib/settings/types";
import { ToggleGroup, ToggleItem } from "./ui/ToggleGroup";
import { CheckboxOption } from "./ui/CheckboxOption";
import { DropdownSelect } from "./ui/DropdownSelect";
import { Sun, Moon, ExternalLink, ChevronDown } from "lucide-react";

const nav = [
  { href: "/axis", label: "1D Axis" },
  { href: "/grid", label: "2D Grid" },
];

const aboutItems = [
  { href: "/about-transform", label: "Fourier Transform" },
  { href: "/about-playground", label: "Fourier's Playground" },
];

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

function AboutDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const active = aboutItems.some((item) => pathname === item.href);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (open && ref.current && !(ref.current as Node).contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative self-stretch flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "group relative flex items-center gap-1 px-1 py-2 sm:text-lg lg:text-xl transition font-serif font-semibold",
          active ? "text-fg" : "text-fg/70 hover:text-fg",
        ].join(" ")}
      >
        <span className="relative inline-block">
          {/* Invisible spacer always reserves the full "About..." width */}
          <span className="invisible select-none" aria-hidden>
            About...
          </span>

          {/* Visible text layer */}
          <span className="absolute inset-0 flex items-center justify-start">
            {/*
              "About" sits centered when closed by shifting right half the dots' width (~8px).
              When opened it slides back to x=0 in sync with the dots popping in.
            */}
            <span
              style={{
                transform: open ? "translateX(0)" : "translateX(8px)",
                transition: "transform 220ms ease",
              }}
            >
              About
            </span>
            {/* Dots stagger in after "About" starts sliding */}
            <span aria-hidden className="flex items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "translateY(0)" : "translateY(4px)",
                    transition: "opacity 130ms ease, transform 130ms ease",
                    transitionDelay: open ? `${50 + i * 80}ms` : "0ms",
                  }}
                >
                  .
                </span>
              ))}
            </span>
          </span>

          {/* Underline bar */}
          <span
            className={[
              "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300",
              active ? "w-full bg-brand-2" : "w-0 bg-fg/0 group-hover:w-full",
            ].join(" ")}
          />
        </span>
        <ChevronDown
          className={[
            "h-4 w-4 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-6 z-50 min-w-60">
          <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg p-1.5">
            {aboutItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className={[
                  "group flex items-center rounded-lg px-4 py-2.5 text-lg font-serif font-semibold transition-colors",
                  pathname === item.href ? "text-brand" : "text-fg/80 hover:text-brand",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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

  const quick = useMemo(
    () => ({
      coloring: settings.coloring,
      center: settings.center,
      magNormalize: settings.magNormalize,
      axis1DOrigin: settings.axis1DOrigin,
    }),
    [settings.coloring, settings.center, settings.magNormalize, settings.axis1DOrigin],
  );

  const isSettingsPage = pathname === "/settings";
  const is1DPage = pathname === "/axis";
  const isAboutPage = pathname.startsWith("/about");

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
              src="/fourier-face.png"
              alt="Fourier’s Playground logo"
              width={50}
              height={50}
              priority
              className="select-none p-1"
            />
            {mobileOpen ? <span>’s Playground</span> : <span>Fourier’s Playground</span>}
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
            <AboutDropdown
              onNavigate={() => {
                setMobileOpen(false);
                setDropdownOpen(false);
              }}
            />
          </nav>
          {/* Settings gear — on About pages it's a direct link to /settings;
               everywhere else it opens the quick-settings dropdown. */}
          <div ref={dropdownRef} className="relative self-stretch flex items-center mr-2">
            {isAboutPage ? (
              <Link
                href="/settings"
                className={[
                  "relative px-1 py-2 text-fg/70 hover:text-fg transition",
                ].join(" ")}
                title="Settings"
                onClick={() => setDropdownOpen(false)}
              >
                <GearIcon className="h-7 w-7 fill-brand-2" />
              </Link>
            ) : (
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

                {/* underline bar (active on /settings) */}
                <span
                  className={[
                    "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300",
                    isSettingsPage ? "w-full bg-fg" : "w-0 bg-fg/0",
                  ].join(" ")}
                />
              </button>
            )}

            {dropdownOpen && !isAboutPage && (
              <div role="menu" className="absolute right-0 top-full mt-6 z-50 w-82">
                <div
                  className={[
                    "min-w-0 shadow-lg",
                    "rounded-xl border border-border",
                    "bg-card/95 backdrop-blur-md",
                    "p-2 sm:p-3",
                  ].join(" ")}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-semibold font-serif leading-none">
                      Quick Settings
                    </span>

                    <Link
                      href="/settings"
                      className="inline-flex text-sm items-center flex-row shadow-sm gap-2 px-2 py-2 justify-center border border-border/80 rounded bg-card hover:bg-fg/10 active:scale-95 transition select-none"
                      style={{ height: 34 }}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Full Settings
                      <ExternalLink className="size-4" />
                    </Link>

                    <button
                      type="button"
                      className="inline-flex h-8 w-8 shadow-sm items-center justify-center border border-border/80 rounded bg-card hover:bg-fg/10 active:scale-95 transition select-none"
                      aria-label="Close"
                      onClick={() => setDropdownOpen(false)}
                      title="Close"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid gap-2">
                    {is1DPage ? (
                      /* ===== 1D Axis quick settings — mirrors the 2D structure ===== */
                      <>
                        {/* n=0 position — same component as 2D Canvas Origin */}
                        <DropdownSelect
                          label="n = 0 position"
                          className="grid gap-1 shadow-sm border border-border/60 rounded-xl bg-card w-full px-3 py-2"
                          value={quick.axis1DOrigin}
                          onChange={(v) =>
                            setSettings((s) => ({
                              ...s,
                              axis1DOrigin: v as Axis1DOrigin,
                            }))
                          }
                          options={[
                            { value: "left", label: "Left (standard)" },
                            { value: "center", label: "Center (symmetric)" },
                          ]}
                        />

                        {/* Normalize magnitude — identical to 2D */}
                        <div className="grid gap-1 shadow-sm border border-border/60 rounded-xl bg-card w-full px-3 py-2">
                          <CheckboxOption
                            id="magnitude-normalization-1d"
                            checked={quick.magNormalize === "max"}
                            onCheckedChange={() => {
                              const next =
                                quick.magNormalize === "max" ? "none" : "max";
                              setSettings((s) => ({
                                ...s,
                                magNormalize: next as MagNormalize,
                              }));
                            }}
                            label="Normalize DFT magnitude."
                            selectedPreview="Result: DFT magnitude is normalized to its maximum."
                            unselectedPreview="Result: DFT magnitude is unnormalized."
                          />
                        </div>
                      </>
                    ) : (
                      /* ===== Default / 2D quick settings ===== */
                      <>
                        {/* Canvas Origin */}
                        <DropdownSelect
                          label="Canvas Origin"
                          className="grid gap-1 shadow-sm border border-border/60 rounded-xl bg-card w-full px-3 py-2"
                          value={quick.center}
                          onChange={(v) =>
                            setSettings((s) => ({
                              ...s,
                              center: v as CenterConvention,
                            }))
                          }
                          options={[
                            { value: "centerPixel", label: "Bottom-right center pixel" },
                            { value: "centerBetween", label: "Between middle pixels" },
                            { value: "topLeft", label: "Top-left pixel" },
                          ]}
                        />

                        {/* Mag Normalize */}
                        <div className="grid gap-1 shadow-sm border border-border/60 rounded-xl bg-card w-full px-3 py-2">
                          <CheckboxOption
                            id="magnitude-normalization"
                            checked={quick.magNormalize === "max"}
                            onCheckedChange={() => {
                              const next = quick.magNormalize === "max" ? "none" : "max";
                              setSettings((s) => ({
                                ...s,
                                magNormalize: next as MagNormalize,
                              }));
                            }}
                            label="Normalize DFT magnitude."
                            selectedPreview="Result: DFT magnitude is normalized to its maximum."
                            unselectedPreview="Result: DFT magnitude is unnormalized."
                          />
                        </div>
                      </>
                    )}

                    {/* Theme toggle — always shown */}
                    <div className="pt-1 grid grid-cols-3 gap-2">
                      <ToggleGroup
                        height={34}
                        className="w-full min-w-0 col-span-2 bg-card shadow-sm"
                      >
                        <ToggleItem
                          active={quick.coloring === "light"}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              coloring: "light" as DisplayColoring,
                            }))
                          }
                          title="Set theme to light."
                          isFirst
                          className="w-[25%]"
                        >
                          <Sun className="h-6 w-6" />
                        </ToggleItem>
                        <ToggleItem
                          active={quick.coloring === "dark"}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              coloring: "dark" as DisplayColoring,
                            }))
                          }
                          title="Set theme to dark."
                          className="w-[25%]"
                        >
                          <Moon className="h-6 w-6" />
                        </ToggleItem>
                        <ToggleItem
                          active={quick.coloring === "system"}
                          onClick={() =>
                            setSettings((s) => ({
                              ...s,
                              coloring: "system" as DisplayColoring,
                            }))
                          }
                          title="Set theme to OS default."
                          className="w-[50%] text-sm"
                          padX={0}
                        >
                          OS Default
                        </ToggleItem>
                      </ToggleGroup>

                      <button
                        type="button"
                        className="inline-flex items-center shadow-sm justify-center border border-border/80 rounded bg-brand-2 text-brand-contrast hover:bg-brand active:scale-95 transition select-none px-2"
                        style={{ height: 34 }}
                        onClick={() => {
                          if (is1DPage) {
                            setSettings((s) => ({
                              ...s,
                              coloring: "system",
                              axis1DOrigin: "left",
                              magNormalize: "max",
                            }));
                          } else {
                            setSettings((s) => ({
                              ...s,
                              coloring: "system",
                              center: "centerBetween",
                              magNormalize: "max",
                            }));
                          }
                        }}
                        title="Reset quick settings"
                      >
                        Reset
                      </button>
                    </div>
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

              <div>
                <span className="block px-2 py-2 text-lg font-semibold font-serif text-fg/50 text-sm uppercase tracking-wider">
                  About
                </span>
                {aboutItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "block px-4 py-2 text-base text-fg/80 hover:text-fg",
                      pathname === item.href ? "text-brand" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 text-lg text-fg/80 hover:text-fg"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
