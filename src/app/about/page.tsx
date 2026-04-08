import Image from "next/image";

const resources = [
  {
    href: "https://www.jezzamon.com/fourier/",
    title: "Jezzamon Interactive Introduction",
    description: "An interactive introduction to the 1D and 2D Fourier Transform.",
    meta: "Reading time: About 12 minutes",
  },
  {
    href: "https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/",
    title: "BetterExplained Interactive Guide",
    description:
      "An intuitive build up to the formula behind the 1D Fourier Transform. Background knowledge on Euler's formula and complex numbers would be helpful.",
    meta: "Reading time: About 20 minutes",
  },
  {
    href: "https://www.youtube.com/watch?v=spUNpyF58BY",
    title: "3Blue1Brown Video",
    description:
      "A beautiful visual introduction on the Fourier Transform by 3Blue1Brown.",
    meta: "Viewing time: About 20 minutes",
    companion: {
      href: "https://www.3blue1brown.com/lessons/fourier-transforms",
      title: "3Blue1Brown Lesson",
      description: "You can also view this video in article form in this lesson.",
      meta: "Reading time: About 25 minutes",
    },
  },
  {
    href: "https://en.wikipedia.org/wiki/Fourier_transform",
    title: "Wikipedia Reference",
    description:
      "This Wikipedia article is an in depth reference point for all things Fourier Transform, though it can be intimidating for those new to Fourier Transforms. I suggest exploring the other resources first before diving into the Wikipedia page.",
    meta: "Reading time: a while*",
    metaNote: "*I haven't made it all the way through this one",
  },
];

export default function AboutPage() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-8 sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute left-6 top-2 hidden h-28 w-28 xl:block">
        <div className="absolute left-0 top-0 h-22 w-22 rounded-tl-[1.6rem] border-l-2 border-t-2 border-frame-accent/70" />
        <div className="absolute left-4 top-4 h-10 w-10 rounded-full border border-frame-trim/45" />
      </div>

      <div className="pointer-events-none absolute right-6 top-2 hidden h-28 w-28 xl:block">
        <div className="absolute right-0 top-0 h-22 w-22 rounded-tr-[1.6rem] border-r-2 border-t-2 border-frame-accent/70" />
        <div className="absolute right-4 top-4 h-10 w-10 rounded-full border border-frame-trim/45" />
      </div>

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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-6 px-6 sm:px-6 lg:px-0">
        <section className="space-y-5">
          {/* <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand sm:text-base">
            About Fourier Transforms
          </p> */}
          <h1 className="max-w-4xl text-4xl leading-tight text-fg sm:text-5xl lg:text-[4.2rem]">
            Learn Fourier Transforms.
          </h1>
          <p className="max-w-4xl text-lg leading-8 text-fg/80 sm:text-xl">
            If you want to learn more about the Fourier Transform, I highly recommend the
            following resources.
          </p>
        </section>

        <section className="grid gap-4 pb-6">
          {resources.map((resource, index) => (
            <div
              key={resource.href}
              className={["grid gap-3", index === 0 ? "relative" : ""].join(" ")}
            >
              {index === 0 ? (
                <div className="pointer-events-none absolute right-8 top-0 z-0 hidden -translate-y-[75%] xl:block">
                  <Image
                    src="/fourier-portrait.png"
                    alt="Joseph Fourier portrait peeking from behind the first card"
                    width={225}
                    height={300}
                    priority
                    className="select-none"
                  />
                </div>
              ) : null}
              <a
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className={[
                  "group grid gap-4 rounded-[1.6rem] border border-border/80 bg-card p-5 shadow-sm transition hover:border-brand/70 hover:bg-card lg:grid-cols-[auto_minmax(0,1fr)_auto]",
                  index === 0 ? "relative z-10" : "",
                ].join(" ")}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-frame-accent/25 bg-bg text-xl font-semibold text-brand">
                  {index + 1}
                </div>

                <div className="flex min-h-full flex-col">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <h2 className="text-2xl text-fg transition group-hover:text-brand">
                      {resource.title}
                    </h2>
                    <span className="flex shrink-0 flex-col text-sm font-semibold uppercase tracking-[0.16em] text-fg/55 lg:items-end lg:text-right">
                      <span className="whitespace-nowrap">{resource.meta}</span>
                    </span>
                  </div>

                  <p className="mt-3 max-w-3xl text-base leading-7 text-fg/80 sm:text-lg">
                    {resource.description}
                  </p>

                  <div className="mt-auto flex flex-col gap-3 pt-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                    <p className="break-all text-sm text-brand sm:text-base">
                      {resource.href}
                    </p>
                    {"metaNote" in resource && resource.metaNote ? (
                      <p className="text-sm leading-5 text-fg/45 lg:shrink-0 lg:text-right">
                        {resource.metaNote}
                      </p>
                    ) : null}
                  </div>
                </div>
              </a>

              {"companion" in resource && resource.companion ? (
                <div className="relative ml-7 border-l border-border/70 pl-6 sm:ml-10 sm:pl-8">
                  <div className="pointer-events-none absolute left-0 top-6 h-px w-4 bg-border sm:w-5" />
                  <a
                    href={resource.companion.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-sm transition hover:border-brand/55 hover:bg-bg/85"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <h3 className="text-xl text-fg transition group-hover:text-brand">
                        {resource.companion.title}
                      </h3>
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.16em] text-fg/55 sm:text-right">
                        {resource.companion.meta}
                      </span>
                    </div>

                    <p className="mt-2 max-w-3xl text-base leading-7 text-fg/80">
                      {resource.companion.description}
                    </p>

                    <p className="mt-3 break-all text-sm text-brand">
                      {resource.companion.href}
                    </p>
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
