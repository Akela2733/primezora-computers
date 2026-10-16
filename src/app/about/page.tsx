import Link from "next/link";
import { ArrowRight, Check, Compass, Sparkles } from "lucide-react";

import { getStorefrontContent } from "@/lib/storefront-content";

const featureIcons = [Compass, Sparkles, Check];

export default async function AboutPage() {
  const content = await getStorefrontContent();
  if (!content) return <main className="min-h-screen bg-[#030505]" />;

  const about = content.about;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#030505] px-4 py-16 text-white/90 sm:px-6 sm:py-20 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_10%,rgba(217,119,6,0.12),transparent_38%),linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.02))]"
      />

      <div className="mx-auto max-w-6xl">
        <section className="max-w-3xl">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-600">
            {about.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-tight tracking-tight text-white sm:text-5xl">
            {about.title}
          </h1>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-white/60 sm:text-lg">
            {about.description}
          </p>
          <Link
            href={about.actionHref}
            className="group mt-8 inline-flex min-h-11 items-center gap-3 rounded-lg border border-amber-600/45 bg-amber-600/8 px-5 text-xs font-semibold uppercase tracking-widest text-amber-500 transition hover:border-amber-500 hover:bg-amber-600 hover:text-black"
          >
            {about.actionLabel}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </section>

        <section
          aria-label="What makes Primezora different"
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {about.features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];

            return (
              <article
                key={`${feature.title}-${index}`}
                className="rounded-xl border border-white/9 bg-white/2 p-6 transition hover:border-amber-600/30 hover:bg-amber-600/2.5 sm:p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/[0.07] text-amber-600">
                  <Icon size={19} strokeWidth={1.8} />
                </span>
                <h2 className="mt-5 font-display text-base font-semibold text-white/90">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/55">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
