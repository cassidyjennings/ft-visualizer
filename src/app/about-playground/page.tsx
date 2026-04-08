import Link from "next/link";

export default function AboutPlaygroundPage() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-8 sm:py-10 lg:py-14">
      {/* Top-left corner decoration */}
      <div className="pointer-events-none absolute left-6 top-2 hidden h-28 w-28 xl:block">
        <div className="absolute left-0 top-0 h-22 w-22 rounded-tl-[1.6rem] border-l-2 border-t-2 border-frame-accent/70" />
        <div className="absolute left-4 top-4 h-10 w-10 rounded-full border border-frame-trim/45" />
      </div>

      {/* Top-right corner decoration */}
      <div className="pointer-events-none absolute right-6 top-2 hidden h-28 w-28 xl:block">
        <div className="absolute right-0 top-0 h-22 w-22 rounded-tr-[1.6rem] border-r-2 border-t-2 border-frame-accent/70" />
        <div className="absolute right-4 top-4 h-10 w-10 rounded-full border border-frame-trim/45" />
      </div>

      {/* Bottom wave decorations */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-24 xl:block">
        <svg
          viewBox="0 0 1600 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-24 w-full text-frame-accent/35"
          aria-hidden="true"
        >
          <path
            d="M0 78c33.333-20 66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0s66.667-20 100 0s66.667 20 100 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <svg
          viewBox="0 0 1600 120"
          preserveAspectRatio="none"
          className="absolute bottom-4 left-0 h-20 w-full text-brand/30"
          aria-hidden="true"
        >
          <path
            d="M0 70c33.333-16 66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0s66.667-16 100 0s66.667 16 100 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <svg
          viewBox="0 0 1600 120"
          preserveAspectRatio="none"
          className="absolute bottom-8 left-0 h-16 w-full text-brand-2/24"
          aria-hidden="true"
        >
          <path
            d="M0 62c33.333-12 66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0s66.667-12 100 0s66.667 12 100 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-6 px-6 sm:px-6 lg:px-0">
        <section className="space-y-5">
          <h1 className="max-w-4xl text-4xl leading-tight text-fg sm:text-5xl lg:text-[4.2rem]">
            About Fourier's Playground.
          </h1>
        </section>

        <section className="flex flex-col gap-10 pb-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl text-fg sm:text-3xl">About the App</h2>
            <p className="text-base leading-8 text-fg/80 sm:text-lg sm:leading-8">
              I built this app after taking 6.300 (Signal Processing) as an undergraduate
              at MIT. During the class, I struggled to build intuition for the Fourier
              Transform. As a visual learner, I tried searching for a tool that would help
              me picture the Fourier Transform of different shapes and patterns. I found
              some very interesting educational tools (many of them listed{" "}
              <Link
                href="/about-transform"
                className="text-brand underline underline-offset-2 transition hover:text-brand-2"
              >
                here
              </Link>
              ), but none that matched exactly what I was looking for — so I decided to
              build it!
            </p>
          </div>

          <div className="w-full border-t border-border/50" />

          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl text-fg sm:text-3xl">
              Content Credits and AI Disclosure
            </h2>
            <p className="text-base leading-8 text-fg/80 sm:text-lg sm:leading-8">
              I built this app using Next.js and React, and deployed it using Vercel. I
              used Codex and Claude Code in later stages of development for debugging and
              some of the decorative elements. I used Canva AI tools to recolor and add a
              hat to a{" "}
              <a
                href="https://commons.wikimedia.org/wiki/File:Fourier2_-_restoration1.jpg?uselang=en#Licensing"
                target="_blank"
                rel="noreferrer"
                className="text-brand underline underline-offset-2 transition hover:text-brand-2"
              >
                public domain picture of Joseph Fourier
              </a>{" "}
              for the branding.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
