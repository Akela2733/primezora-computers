"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSupportedCategoryHref } from "@/lib/categories";

const gamingCategoryHref = getSupportedCategoryHref("gaming");
const pcComponentsCategoryHref = getSupportedCategoryHref("pc-components");

const gamingSlides = [
  {
    image: "/banners/banner1.jfif",
    alt: "Gaming controller and accessories",
    eyebrow: "Gaming Accessories",
    firstLine: "Level Up",
    secondPrefix: "Your",
    accent: "Game",
    description: "Controllers, headsets, chairs and more. Built for every gamer.",
    action: "Shop Gaming",
    href: gamingCategoryHref,
  },
  {
    image: "/banners/banner1.2.jfif",
    alt: "Gaming gear for a custom setup",
    eyebrow: "Find Your Edge",
    firstLine: "Own Every",
    secondPrefix: "Gaming",
    accent: "Moment",
    description: "Choose the accessories that make every session your own.",
    action: "Explore Gear",
    href: gamingCategoryHref,
  },
  {
    image: "/banners/banner%201.3.jfif",
    alt: "A complete gaming setup ready to upgrade",
    eyebrow: "Built for Play",
    firstLine: "Play Beyond",
    secondPrefix: "Your",
    accent: "Limits",
    description: "Performance gear for longer sessions and bigger wins.",
    action: "Discover Gaming",
    href: gamingCategoryHref,
  },
];

const pcSlides = [
  {
    image: "/banners/banner2.jfif",
    alt: "Amber-lit custom gaming PC build",
    eyebrow: "PC Builds & Components",
    firstLine: "Build Your",
    accent: "Dream PC",
    description: "Top brands. Best performance. Your custom build, our expertise.",
    action: "Shop PC Parts",
    href: pcComponentsCategoryHref,
  },
  {
    image: "/banners/banner%202.2.jfif",
    alt: "Performance PC components for a custom build",
    eyebrow: "Performance Components",
    firstLine: "Power Your",
    accent: "Setup",
    description: "Find the components that bring your next build to life.",
    action: "Explore Components",
    href: pcComponentsCategoryHref,
  },
  {
    image: "/banners/banner%202.3.jfif",
    alt: "Custom PC hardware for gaming and creative work",
    eyebrow: "Made for Your Build",
    firstLine: "Build Without",
    accent: "Limits",
    description: "Reliable hardware for gaming, creating, and everything between.",
    action: "Build Your PC",
    href: pcComponentsCategoryHref,
  },
];

export function BuildPCBanner() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activePcSlide, setActivePcSlide] = useState(0);
  const slide = gamingSlides[activeSlide];
  const pcSlide = pcSlides[activePcSlide];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % gamingSlides.length);
      setActivePcSlide((current) => (current + 1) % pcSlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#030505] py-7 sm:py-9">
      <div className="container-primezora">
        <div className="grid gap-3 md:grid-cols-2">
          <article
            aria-roledescription="carousel"
            aria-label="Gaming accessories promotions"
            className="group relative isolate min-h-55 overflow-hidden border border-white/10 bg-[#070909] sm:min-h-62.5"
          >
            <Image
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              fill
              priority={activeSlide === 0}
              sizes="(max-width: 767px) 100vw, 50vw"
              className="-z-20 object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/5 via-black/25 to-black/90" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-transparent to-black/10" />

            <div
              key={slide.eyebrow}
              className="relative z-10 ml-[34%] flex min-h-55 max-w-[66%] flex-col justify-center py-5 pl-2 pr-4 sm:min-h-62.5 sm:pl-4 sm:pr-6"
              role="group"
              aria-roledescription="slide"
              aria-label={`${activeSlide + 1} of ${gamingSlides.length}`}
            >
              <p className="mb-2 font-display text-[7px] font-semibold uppercase tracking-[0.18em] text-white/65 sm:text-[8px]">
                {slide.eyebrow}
              </p>
              <h2 className="font-display text-[22px] font-bold uppercase leading-[1.05] text-white sm:text-[28px]">
                {slide.firstLine}
                <br />
                {slide.secondPrefix} <span className="text-[#f1972e]">{slide.accent}</span>
              </h2>
              <p className="mt-2 max-w-55 text-[9px] leading-[1.45] text-white/65 sm:text-[10px]">
                {slide.description}
              </p>
              <div className="mt-3">
                <Link
                  href={slide.href}
                  className="group/link inline-flex w-fit items-center gap-2 border-b border-[#e88720]/70 pb-1 font-display text-[8px] font-semibold uppercase tracking-[0.12em] text-[#f3a03e] transition hover:text-amber-200 sm:text-[9px]"
                >
                  {slide.action}
                  <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </article>

          <article className="group relative isolate min-h-55 overflow-hidden border border-white/10 bg-[#070909] sm:min-h-62.5">
            <Image
              key={pcSlide.image}
              src={pcSlide.image}
              alt={pcSlide.alt}
              fill
              priority={activePcSlide === 0}
              sizes="(max-width: 767px) 100vw, 50vw"
              className="-z-20 object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/90 via-black/65 to-black/5" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/60 via-transparent to-black/10" />

            <div
              key={pcSlide.eyebrow}
              className="relative z-10 flex min-h-55 max-w-[62%] flex-col justify-center py-5 pl-5 pr-2 sm:min-h-62.5 sm:pl-6 sm:pr-4"
              role="group"
              aria-roledescription="slide"
              aria-label={`${activePcSlide + 1} of ${pcSlides.length}`}
            >
              <p className="mb-2 font-display text-[7px] font-semibold uppercase tracking-[0.18em] text-white/65 sm:text-[8px]">
                {pcSlide.eyebrow}
              </p>
              <h2 className="font-display text-[22px] font-bold uppercase leading-[1.05] text-white sm:text-[28px]">
                {pcSlide.firstLine}
                <br />
                <span className="text-[#f1972e]">{pcSlide.accent}</span>
              </h2>
              <p className="mt-2 max-w-55 text-[9px] leading-[1.45] text-white/65 sm:text-[10px]">
                {pcSlide.description}
              </p>
              <div className="mt-3">
                <Link
                  href={pcSlide.href}
                  className="group/link inline-flex w-fit items-center gap-2 border-b border-[#e88720]/70 pb-1 font-display text-[8px] font-semibold uppercase tracking-[0.12em] text-[#f3a03e] transition hover:text-amber-200 sm:text-[9px]"
                >
                  {pcSlide.action}
                  <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
