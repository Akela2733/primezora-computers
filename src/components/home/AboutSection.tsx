import Link from "next/link";
import { ArrowRight, Check, Compass, Sparkles } from "lucide-react";

import { getStorefrontContent } from "@/lib/storefront-content";

const featureIcons = [Compass, Sparkles, Check];

export async function AboutSection() {
  const content = await getStorefrontContent();
  if (!content) return null;

  const about = content.about;

  return (
    <section
      aria-labelledby="about-section-title"
      className="relative isolate overflow-hidden border-y border-white/[0.07] bg-[#050707] py-14 text-white/90 sm:py-18 lg:py-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_50%,rgba(217,119,6,0.08),transparent_38%),linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.02))]"
      />

      <div className="container-primezora grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-600">
            {about.eyebrow}
          </p>
          <h2
            id="about-section-title"
            className="mt-4 max-w-xl font-display text-3xl font-bold uppercase leading-tight tracking-tight text-white sm:text-4xl"
          >
            {about.title}
          </h2>
          <p className="mt-5 max-w-xl whitespace-pre-line text-sm leading-7 text-white/60 sm:text-base">
            {about.description}
          </p>
          <Link
            href={about.actionHref}
            className="primezora-button mt-7"
          >
            <span>{about.actionLabel}</span>
            <span className="primezora-button__icon"><ArrowRight size={13} /></span>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {about.features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <article
                key={`${feature.title}-${index}`}
                data-tilt-card
                className={`tilt-card group rounded-xl border border-white/[0.09] bg-[#030505]/75 p-5 transition hover:border-amber-600/30 hover:bg-amber-600/[0.025] sm:p-6 ${
                  index === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/[0.07] text-amber-600 transition group-hover:border-amber-600/40 group-hover:bg-amber-600/[0.12]">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-display text-sm font-semibold text-white/90 sm:text-base">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
