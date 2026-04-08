import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-7xl items-center">
      <section className="relative w-full py-10 sm:py-14 lg:py-20">
        <div className="pointer-events-none absolute inset-4 rounded-[2.75rem] border border-frame-trim/70 lg:inset-8" />
        <div className="pointer-events-none absolute inset-6 rounded-[2.5rem] border border-frame-accent/55 lg:inset-10" />
        <div className="pointer-events-none absolute inset-8 rounded-[2.2rem] border border-border/65 lg:inset-14" />
        <div className="pointer-events-none absolute inset-10 rounded-[1.95rem] border border-frame-accent/38 lg:inset-[4.5rem]" />

        <div className="pointer-events-none absolute inset-x-18 top-4 hidden h-px bg-gradient-to-r from-transparent via-frame-accent/75 to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-x-18 bottom-4 hidden h-px bg-gradient-to-r from-transparent via-frame-accent/55 to-transparent lg:block" />
        <div className="pointer-events-none absolute left-4 top-18 hidden h-[calc(100%-9rem)] w-px bg-gradient-to-b from-transparent via-frame-trim/80 to-transparent lg:block" />
        <div className="pointer-events-none absolute right-4 top-18 hidden h-[calc(100%-9rem)] w-px bg-gradient-to-b from-transparent via-frame-trim/80 to-transparent lg:block" />

        <div className="pointer-events-none absolute left-10 top-10 h-18 w-18 rounded-full border border-brand/18 bg-brand/8 blur-2xl" />
        <div className="pointer-events-none absolute bottom-10 right-14 h-24 w-24 rounded-full border border-brand-2/16 bg-brand-2/8 blur-3xl" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand sm:text-base">
            Fourier&apos;s Playground
          </p>

          <div className="mt-6 space-y-6">
            <h1 className="text-4xl leading-[1.04] text-fg sm:text-5xl lg:text-[4.85rem]">
              Welcome!
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-fg/80 sm:text-xl">
              Joseph Fourier proposed that any signal - music, images, electric current,
              brain waves, and more - can be expressed as a sum of simple sine and cosine
              waves. Use the tools on this website to play around with this idea.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/draw"
              className="inline-flex items-center justify-center rounded-xl border border-frame-accent/60 bg-brand-2 px-6 py-3 text-base font-semibold text-brand-contrast shadow-sm transition hover:bg-brand active:scale-[0.98]"
            >
              Explore this in 2D
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute left-8 top-8 hidden lg:block">
          <div className="relative h-14 w-14">
            <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-[1.2rem] border-l-2 border-t-2 border-frame-accent/80" />
            <div className="absolute left-3 top-3 h-6 w-6 rounded-full border border-frame-trim/55" />
          </div>
        </div>
        <div className="pointer-events-none absolute right-8 top-8 hidden lg:block">
          <div className="relative h-14 w-14">
            <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-[1.2rem] border-r-2 border-t-2 border-frame-accent/80" />
            <div className="absolute right-3 top-3 h-6 w-6 rounded-full border border-frame-trim/55" />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-8 left-8 hidden lg:block">
          <div className="relative h-14 w-14">
            <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[1.2rem] border-b-2 border-l-2 border-frame-accent/80" />
            <div className="absolute bottom-3 left-3 h-6 w-6 rounded-full border border-frame-trim/55" />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-8 right-8 hidden lg:block">
          <div className="relative h-14 w-14">
            <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[1.2rem] border-b-2 border-r-2 border-frame-accent/80" />
            <div className="absolute bottom-3 right-3 h-6 w-6 rounded-full border border-frame-trim/55" />
          </div>
        </div>
      </section>
    </div>
  );
}
