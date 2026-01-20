"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/draw", label: "Draw" },
  { href: "/settings", label: "Settings" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "rounded-md px-3 py-2 text-base sm:text-lg lg:text-xl transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/70 hover:text-white hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12 xl:px-24">
        <Link
          href="/"
          className="min-w-0 font-semibold tracking-tight text-lg sm:text-xl lg:text-2xl text-white truncate"
          title="Fourier Transform Visualizer"
        >
          Fourier Transform Visualizer
        </Link>

        <nav className="flex flex-none items-center gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </header>
  );
}
