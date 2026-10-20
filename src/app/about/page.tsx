import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Eye,
  Heart,
  MapPin,
  Rocket,
  Sparkles,
} from "lucide-react";

import { AnimatedStats } from "@/components/about/AnimatedStats";
import { getStorefrontContent } from "@/lib/storefront-content";

const valueIcons = [Rocket, Eye, Heart];
const principles = [
  {
    title: "Our Mission",
    description:
      "To help every customer find reliable technology that makes work, play, and creativity better.",
    icon: Rocket,
  },
  {
    title: "Our Vision",
    description:
      "To be Sri Lanka’s most trusted destination for computer hardware and technology.",
    icon: Eye,
  },
  {
    title: "Our Values",
    description:
      "Expert guidance, genuine products, dependable service, and lasting customer relationships.",
    icon: Heart,
  },
];
const shopLocation = "Eheliyagoda, Sri Lanka";
const shopMapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopLocation)}`;
const shopMapEmbedSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=80.2325436%2C6.8231322%2C80.2925436%2C6.8831322&layer=mapnik&marker=6.8531322%2C80.2625436";

export default async function AboutPage() {
  const content = await getStorefrontContent();

  if (!content) return <main className="min-h-screen bg-[#030505]" />;

  const { about, home, footer } = content;
  const values = home.why.reasons.slice(0, 3);

  return (
    <main className="overflow-hidden bg-[#030505] text-white/90">
      <section className="relative isolate flex min-h-[390px] items-center overflow-hidden sm:min-h-[440px] lg:min-h-[500px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-[62%_center]"
          style={{ backgroundImage: 'url("/banners/about%20banner%201.png")' }}
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#030505]/95 via-[#030505]/72 via-48% to-[#030505]/15" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/70 via-transparent to-[#030505]/15" />

        <div className="container-primezora relative py-14 sm:py-16 lg:py-20">
          <div className="max-w-xl">
            <p className="font-display text-[9px] font-semibold uppercase tracking-[0.25em] text-orange-500">
              {about.eyebrow}
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              {about.title}
            </h1>
            <p className="mt-5 max-w-md whitespace-pre-line text-xs leading-6 text-white/70 sm:text-sm">
              {about.description}
            </p>
            <Link
              href="#our-story"
              className="group mt-6 inline-flex h-10 items-center gap-4 rounded-sm bg-orange-500 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#090909] transition hover:bg-orange-400"
            >
              {about.actionLabel}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
          <a
            href="#our-story"
            className="absolute bottom-6 right-4 hidden items-center gap-3 font-display text-[8px] uppercase tracking-[0.16em] text-white/60 sm:inline-flex lg:right-8"
          >
            Scroll
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/60 text-orange-400">
              <ArrowDown size={13} />
            </span>
          </a>
        </div>
      </section>

      <section
        id="our-story"
        className="relative isolate overflow-hidden border-y border-white/10"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-[35%_center] md:bg-left"
          style={{ backgroundImage: 'url("/banners/about%20banner%203.png")' }}
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#030505]/20 via-[#030505]/65 via-40% to-[#030505]/98" />
        <div className="absolute inset-0 -z-10 bg-[#030505]/35" />

        <div className="container-primezora grid min-h-[330px] gap-8 py-10 sm:py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:min-h-[370px]">
          <div aria-hidden="true" className="hidden md:block" />
          <div className="grid gap-8 md:grid-cols-[1fr_0.95fr] md:items-center md:gap-7">
            <div>
              <p className="font-display text-[8px] font-semibold uppercase tracking-[0.22em] text-orange-500">
                {home.why.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase leading-[1.05] sm:text-3xl">
                {about.title}
              </h2>
              <p className="mt-4 whitespace-pre-line text-[10px] leading-5 text-white/60 sm:text-xs sm:leading-6">
                {about.description}
              </p>
              <Link
                href={about.actionHref}
                className="group mt-5 inline-flex h-9 items-center gap-3 border border-orange-500/60 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] text-white/90 transition hover:bg-orange-500 hover:text-[#090909]"
              >
                {about.actionLabel}
                <ArrowRight
                  size={12}
                  className="text-orange-400 transition-transform group-hover:translate-x-1 group-hover:text-[#090909]"
                />
              </Link>
            </div>

            {values.length > 0 && (
              <div className="space-y-5 border-white/10 md:border-l md:pl-6">
                {values.map((value, index) => {
                  const Icon = valueIcons[index] ?? Sparkles;
                  return (
                    <article
                      key={`${value.title}-${index}`}
                      className="flex gap-4"
                    >
                      <Icon
                        aria-hidden="true"
                        size={27}
                        strokeWidth={1.4}
                        className="mt-0.5 shrink-0 text-orange-500"
                      />
                      <div>
                        <h3 className="font-display text-[10px] font-semibold uppercase text-white/85">
                          {value.title}
                        </h3>
                        <p className="mt-1 text-[9px] leading-4 text-white/50">
                          {value.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10 py-10 sm:py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-35"
          style={{ backgroundImage: 'url("/banners/about%20banner%202.png")' }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#030505]/65" />
        <div className="container-primezora grid gap-7 lg:grid-cols-[0.9fr_2.1fr] lg:items-center lg:gap-10">
          <div>
            <p className="font-display text-[8px] font-semibold uppercase tracking-[0.22em] text-orange-500">
              {about.eyebrow}
            </p>
            <h2 className="mt-2 max-w-sm font-display text-2xl font-bold uppercase leading-[1.05] sm:text-3xl">
              {about.title}
            </h2>
            <p className="mt-3 max-w-md text-[10px] leading-5 text-white/55 sm:text-xs">
              {about.description}
            </p>
            <Link
              href={about.actionHref}
              className="group mt-4 inline-flex h-9 items-center gap-3 border border-orange-500/50 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] text-white/85 transition hover:bg-orange-500 hover:text-[#090909]"
            >
              {about.actionLabel}
              <ArrowRight
                size={12}
                className="text-orange-400 transition-transform group-hover:translate-x-1 group-hover:text-[#090909]"
              />
            </Link>
          </div>

          <div className="grid w-full max-w-[540px] grid-cols-3 gap-2 justify-self-end sm:gap-3">
            {principles.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-md border border-white/10 bg-white/[0.02] p-2.5 text-center transition hover:border-orange-500/35 hover:bg-orange-500/[0.03] sm:p-3"
              >
                <Icon
                  aria-hidden="true"
                  size={22}
                  strokeWidth={1.6}
                  className="mx-auto text-orange-500"
                />
                <h3 className="mt-2 font-display text-[10px] font-semibold text-white/90 sm:text-xs">
                  {title}
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-white/60 sm:text-[11px] sm:leading-5">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10 py-5 sm:py-7">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-35"
          style={{ backgroundImage: 'url("/banners/about%20banner%203.png")' }}
        />
        <div className="absolute inset-0 -z-10 bg-[#030505]/65" />
        <AnimatedStats />
      </section>

      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(home.hero.image)})` }}
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#030505]/30 via-[#030505]/80 to-[#030505]/95" />
        <div className="container-primezora grid min-h-[290px] gap-6 py-8 sm:py-10 md:grid-cols-[1fr_1fr] md:items-center lg:min-h-[330px]">
          <div className="relative hidden h-52 overflow-hidden rounded-md border border-white/10 md:block lg:h-60">
            <iframe
              title={`Map showing ${shopLocation}`}
              src={shopMapEmbedSrc}
              className="h-full w-full border-0 grayscale-[0.35]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div>
            <p className="font-display text-[8px] font-semibold uppercase tracking-[0.22em] text-orange-500">
              {footer.contactTitle}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold uppercase leading-[1.05] sm:text-3xl">
              {shopLocation}
            </h2>
            <p className="mt-3 max-w-md text-[10px] leading-5 text-white/60 sm:text-xs">
              {about.description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-white/65">
              <MapPin size={13} className="shrink-0 text-orange-500" />
              <span>{shopLocation}</span>
            </div>
            <Link
              href={shopMapHref}
              target="_blank"
              rel="noreferrer"
              className="group mt-4 inline-flex h-9 items-center gap-3 border border-orange-500/55 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] text-white/90 transition hover:bg-orange-500 hover:text-[#090909]"
            >
              {shopLocation}
              <ArrowRight
                size={12}
                className="text-orange-400 transition-transform group-hover:translate-x-1 group-hover:text-[#090909]"
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
