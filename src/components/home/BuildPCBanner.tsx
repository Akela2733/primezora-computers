"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PromoBanner } from "@/lib/storefront-content";

function BannerCarousel({
  banners,
}: {
  banners: PromoBanner[];
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (banners.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const slide = banners[activeSlide];

  return (
    <article
      aria-roledescription="carousel"
      aria-label={slide.eyebrow}
      className="group relative isolate min-h-55 overflow-hidden border border-white/10 bg-[#030505] sm:min-h-62.5"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${JSON.stringify(slide.image)})` }}
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/5 via-black/25 to-black/90" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-transparent to-black/10" />

      <div
        key={slide.eyebrow}
        className="relative z-10 ml-[34%] flex min-h-55 max-w-[66%] flex-col justify-center py-5 pl-2 pr-4 sm:min-h-62.5 sm:pl-4 sm:pr-6"
        role="group"
        aria-roledescription="slide"
        aria-label={`${activeSlide + 1} of ${banners.length}`}
      >
        <p className="mb-2 font-display text-[7px] font-semibold uppercase tracking-[0.18em] text-white/65 sm:text-[8px]">
          {slide.eyebrow}
        </p>
        <h2 className="font-display text-[22px] font-bold uppercase leading-[1.05] text-white/90 sm:text-[28px]">
          {slide.titleLines.map((line, index) => (
            <span
              key={`${index}-${line}`}
              className={index === slide.accentLine ? "text-amber-600" : undefined}
            >
              {line}
              {index < slide.titleLines.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="mt-2 max-w-55 text-[9px] leading-[1.45] text-white/65 sm:text-[10px]">
          {slide.description}
        </p>
        <div className="mt-3">
          <Link
            href={slide.href}
            className="group/link inline-flex w-fit items-center gap-2 border-b border-amber-600/70 pb-1 font-display text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-600 transition hover:text-amber-600 sm:text-[9px]"
          >
            {slide.actionLabel}
            <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BuildPCBanner({
  left,
  right,
}: {
  left: PromoBanner[];
  right: PromoBanner[];
}) {
  if (left.length === 0 && right.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#030505] py-7 sm:py-9">
      <div className="container-primezora">
        <div className="grid gap-3 md:grid-cols-2">
          <BannerCarousel banners={left} />
          <BannerCarousel banners={right} />
        </div>
      </div>
    </section>
  );
}
