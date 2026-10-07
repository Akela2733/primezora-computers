import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  RefreshCw,
  Truck,
} from "lucide-react";

const reasons = [
  {
    icon: BadgeCheck,
    title: "100% Original Products",
    description: "Buy with confidence",
  },
  {
    icon: Headphones,
    title: "Expert Support & Advice",
    description: "Real people. Real help.",
  },
  {
    icon: Truck,
    title: "Islandwide Delivery",
    description: "Fast. Safe. Reliable.",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "Hassle-free process",
  },
];

export function WhyPrimezora() {
  return (
    <section className="relative isolate overflow-hidden border-y border-amber-500/15 bg-[#030505] text-white">
      <Image
        src="/banners/why%20primezora.jfif"
        alt="Gamer enjoying a PC setup"
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[68%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#030505] via-[#030505]/95 via-55% to-[#030505]/15" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/75 via-transparent to-[#030505]/15" />

      <div className="container-primezora relative grid min-h-68 gap-6 py-8 sm:py-10 lg:grid-cols-[0.95fr_1.1fr_1.35fr] lg:items-stretch lg:gap-5 lg:py-7">
        <div className="flex flex-col items-start justify-center border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <p className="mb-3 font-display text-[8px] font-semibold uppercase tracking-[0.24em] text-amber-400/80">
            Why Primezora
          </p>
          <h2 className="font-display text-[27px] font-bold uppercase leading-[1.05] sm:text-[32px]">
            More Than
            <br />
            Just a Store
          </h2>
          <p className="mt-3 max-w-[250px] text-[11px] leading-[1.55] text-white/60 sm:text-xs">
            We&apos;re tech enthusiasts, just like you. That&apos;s why we bring
            you the best products, expert support and islandwide delivery.
          </p>
          <Link
            href="/about"
            className="group mt-4 inline-flex h-9 items-center gap-3 border border-amber-500/60 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-amber-500 hover:text-[#100a03]"
          >
            Learn More
            <ArrowRight size={12} className="text-amber-400 transition-transform group-hover:translate-x-1 group-hover:text-[#100a03]" />
          </Link>
        </div>

        <div className="grid grid-cols-2">
          {reasons.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className={`flex flex-col justify-center gap-1.5 px-3 py-3 sm:px-4 ${
                index % 2 === 1 ? "border-l border-white/10" : ""
              } ${index > 1 ? "border-t border-white/10" : ""}`}
            >
              <Icon size={23} strokeWidth={1.7} className="mb-1 text-[#e88720]" />
              <h3 className="font-display text-[9px] font-semibold leading-[1.35] text-white/90 sm:text-[10px]">
                {title}
              </h3>
              <p className="text-[8px] leading-[1.4] text-white/45 sm:text-[9px]">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </section>
  );
}
