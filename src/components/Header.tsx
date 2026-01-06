"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/draw", label: "Draw" },
  { href: "/settings", label: "Settings" },
  // { href: "/info", label: "Info" }, // later
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "rounded-md px-3 py-2 text-xl transition",
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
      <div className="mx-auto flex h-20 w-full items-center justify-between px-24">
        <Link href="/" className="font-semibold tracking-tight text-2xl text-white">
          Fourier Transform Visualizer
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </header>
  );
}
