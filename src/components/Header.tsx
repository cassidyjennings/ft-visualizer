"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useSettings } from "@/lib/settings/SettingsContext";
import type {
  CenterConvention,
  DisplayColoring,
  MagNormalize,
} from "@/lib/settings/types";
import { ToggleGroup, ToggleItem } from "./ui/ToggleGroup";
import { CheckboxOption } from "./ui/CheckboxOption";
import { DropdownSelect } from "./ui/DropdownSelect";

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
        "group relative px-1 py-2 font-serif font-semibold transition",
        "text-base sm:text-lg lg:text-xl",
        active ? "text-fg" : "text-fg/70 hover:text-fg",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300",
          active ? "w-full bg-brand-2" : "w-0 bg-fg/0 group-hover:w-full",
        ].join(" ")}
      />
    </Link>
  );
}

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

function HeaderPanel({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "min-w-0 rounded-xl border border-border bg-card p-2 shadow-lg sm:p-3",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="font-semibold leading-none">{title}</span>
        {actions}
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { settings, setSettings } = useSettings();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;

      if (dropdownOpen && dropdownRef.current && t && !dropdownRef.current.contains(t)) {
        setDropdownOpen(false);
      }

      if (mobileOpen && mobileMenuRef.current && t && !mobileMenuRef.current.contains(t)) {
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
    }),
    [settings.center, settings.coloring, settings.magNormalize],
  );

  const isSettingsPage = pathname === "/settings";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex min-h-17.5 w-full items-center gap-3 px-4 sm:px-6">
        <h1 className="min-w-0 flex-1 text-fg font-serif">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 sm:gap-5"
            onClick={() => {
              setMobileOpen(false);
              setDropdownOpen(false);
            }}
          >
            <Image
              src="/silly-fourier-square.png"
              alt="Fourier's Playground logo"
              width={60}
              height={60}
              priority
              className="h-11 w-11 shrink-0 select-none sm:h-[60px] sm:w-[60px]"
            />
            <span className="min-w-0 text-[clamp(0.95rem,3vw,2rem)] leading-tight sm:text-[clamp(1.2rem,3vw,2rem)]">
              Fourier&apos;s Playground
            </span>
          </Link>
        </h1>

        <div className="ml-auto flex items-center gap-3 sm:gap-6">
          <nav className="hidden lg:flex items-center gap-8 px-6">
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

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((v) => !v)}
              className={[
                "relative px-1 py-2 text-fg/70 transition hover:text-fg",
                dropdownOpen ? "text-fg" : "",
              ].join(" ")}
              title="Settings"
            >
              <span className="inline-flex items-center gap-2">
                <GearIcon className="h-7 w-7 fill-brand-2" />
              </span>
              <span
                className={[
                  "pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 transition-all duration-300",
                  isSettingsPage ? "w-full bg-fg" : "w-0 bg-fg/0",
                ].join(" ")}
              />
            </button>

            {dropdownOpen && (
              <div role="menu" className="absolute right-0 top-11 z-50 w-82">
                <HeaderPanel
                  title="Quick Settings"
                  actions={
                    <div className="flex items-center gap-2">
                      <Link
                        href="/settings"
                        className="inline-flex h-8 items-center justify-center rounded border border-border/80 bg-card px-2 shadow-sm transition hover:bg-fg/10 active:scale-95"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Full settings
                      </Link>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-border/80 bg-card shadow-sm transition hover:bg-fg/10 active:scale-95"
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
                  }
                >
                  <DropdownSelect
                    label="Canvas Origin"
                    className="grid w-full gap-1 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm"
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

                  <div className="grid gap-1 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
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
                      label="Display normalized DFT magnitude."
                      selectedPreview="DFT magnitude is normalized to its maximum."
                      unselectedPreview="DFT magnitude is unnormalized."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <ToggleGroup
                      height={34}
                      className="col-span-2 w-full min-w-0 bg-card shadow-sm"
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
                      className="inline-flex items-center justify-center rounded border border-border/80 bg-brand-2 px-2 text-brand-contrast shadow-sm transition hover:bg-brand active:scale-95"
                      style={{ height: 34 }}
                      onClick={() => {
                        setSettings((s) => ({
                          ...s,
                          coloring: "system",
                          center: "centerBetween",
                          magNormalize: "max",
                        }));
                      }}
                      title="Reset quick settings"
                    >
                      Reset
                    </button>
                  </div>
                </HeaderPanel>
              </div>
            )}
          </div>

          <div ref={mobileMenuRef} className="relative lg:hidden">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center text-fg/80 transition hover:text-fg"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
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
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-bg/55 backdrop-blur-sm" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm items-start justify-end p-3 sm:p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-3 shadow-lg">
              <div className="flex items-center justify-between gap-2 pb-2">
                <span className="font-semibold leading-none">Menu</span>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-border/80 bg-card shadow-sm transition hover:bg-fg/10 active:scale-95"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
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
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-base font-medium text-fg/80 shadow-sm transition hover:bg-fg/10 hover:text-fg"
                  >
                    {item.label}
                  </Link>
                ))}

                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-base font-medium text-fg/80 shadow-sm transition hover:bg-fg/10 hover:text-fg"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
