import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center">
      <section className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center">
        <div className="relative overflow-hidden rounded-4xl border border-border bg-card/85 p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-brand via-brand-2 to-brand-3" />
          <div className="absolute -right-12 top-12 h-36 w-36 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-6 left-6 h-24 w-24 rounded-full border border-border/60 bg-muted/60" />

          <div className="relative space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">
              Fourier&apos;s Playground
            </p>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl leading-tight text-fg sm:text-5xl lg:text-6xl">
                Everything is made of frequencies
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-fg/78 sm:text-xl">
                From music to images, complex signals can be broken down into combinations
                of repeating patterns. Joseph Fourier proposed that any signal can be
                expressed as a sum of simple sine and cosine waves.
              </p>
            </div>

            <Link
              href="/draw"
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-brand-2 px-6 py-3 text-base font-semibold text-brand-contrast shadow-sm transition hover:bg-brand active:scale-[0.98]"
            >
              Explore this in 2D
            </Link>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-[1.75rem] border border-border bg-muted/70 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-2">
              Why Fourier?
            </p>
            <p className="mt-3 text-base leading-7 text-fg/75">
              The 2D view lets you draw directly on a grid and watch those repeating
              patterns show up as magnitude and phase.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-card/70 p-6 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-brand/12 p-4">
                <div className="h-14 rounded-xl bg-linear-to-b from-brand/70 to-brand-2/30" />
              </div>
              <div className="rounded-2xl bg-brand-3/10 p-4">
                <div className="grid h-14 grid-cols-4 gap-1">
                  <span className="rounded bg-brand-3/35" />
                  <span className="rounded bg-brand-3/55" />
                  <span className="rounded bg-brand-3/35" />
                  <span className="rounded bg-brand-3/20" />
                </div>
              </div>
              <div className="rounded-2xl bg-brand-2/10 p-4">
                <div className="flex h-14 items-center justify-center rounded-xl border border-brand-2/30">
                  <span className="h-6 w-6 rounded-full bg-brand-2/60" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
