import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Gamepad2,
  Headphones,
  Headset,
} from "lucide-react";
import { PointerSpotlight } from "@/components/animations/ScrollMotion";
import { getStorefrontContent } from "@/lib/storefront-content";

export async function Hero() {
  const content = await getStorefrontContent();
  if (!content) return null;

  const hero = content.home.hero;
  let characterIndex = 0;

  return (
    <section data-motion-reveal className="relative isolate overflow-hidden bg-[#030505] text-white/90">
      <div
        aria-hidden="true"
        className="home-hero-parallax absolute inset-0 -z-20 bg-cover bg-[58%_center] md:bg-center"
        style={{
          backgroundImage: 'url("/banners/hero%20section%20background%20image.png")',
        }}
      />
       <div className="absolute inset-0 bg-linear-to-r from-[#030505]/50 via-[#030505]/10 to-[#030505]/20" /> 
      <div className="absolute inset-0 bg-linear-to-t from-[#030505]/65 via-transparent to-[#030505]/10" />
      <PointerSpotlight />

      <div className="container-primezora relative grid min-h-[540px] grid-cols-1 content-center gap-x-10 gap-y-10 py-12 sm:min-h-[580px] md:min-h-[clamp(420px,42vw,640px)] md:grid-cols-[minmax(0,1fr)_220px] md:items-center md:py-12">
        <div className="home-hero-copy max-w-[410px]">
          <p className="mb-4 whitespace-pre-line font-display text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-500 sm:text-[10px]">
            {hero.eyebrow}
          </p>

          <h1
            aria-label={hero.titleLines.join(" ")}
            className="home-hero-title font-display text-[38px] font-bold uppercase leading-[0.99] tracking-[-0.045em] text-white sm:text-5xl md:text-[clamp(42px,5vw,64px)]"
          >
            {hero.titleLines.map((line, index) => (
              <span
                key={`${index}-${line}`}
                aria-hidden="true"
                className={index === hero.accentLine ? "text-orange-500" : undefined}
              >
                {Array.from(line).map((character) => {
                  const currentIndex = characterIndex++;
                  return (
                    <span
                      key={`${currentIndex}-${character}`}
                      className="home-hero-title-character"
                      style={{ animationDelay: `${200 + currentIndex * 38}ms` }}
                    >
                      {character === " " ? "\u00a0" : character}
                    </span>
                  );
                })}
                {index < hero.titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="mt-4 max-w-[330px] text-xs leading-[1.55] text-white/75 sm:text-[13px]">
            {hero.description}
          </p>

          <Link
            href={hero.actionHref}
            className="group mt-6 inline-flex h-9 min-w-[158px] items-center justify-between gap-5 rounded-md bg-orange-500 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#090909] transition hover:bg-orange-400"
          >
            {hero.actionLabel}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <nav aria-label="Explore Primezora" className="hero-shortcut-nav hidden md:block">
          <ul data-motion-stagger className="hero-shortcut-list">
            {[
              { label: "Gaming PCs", detail: "Play Beyond Limits", href: "/shop", icon: Gamepad2 },
              { label: "PC Components", detail: "Build with Confidence", href: "/shop", icon: Boxes },
              { label: "Accessories", detail: "Small Gear. Big Impact", href: "/shop", icon: Headphones },
              { label: "Support", detail: "We're Always Here", href: "/contact", icon: Headset },
            ].map((item) => (
              <li key={item.label} data-motion-reveal>
                <Link
                  href={item.href}
                  title={item.label}
                  className="hero-shortcut-link group"
                >
                  <span className="hero-shortcut-copy">
                    <span className="block whitespace-nowrap font-display text-[10px] font-semibold text-white/95">
                      {item.label}
                    </span>
                    <span className="mt-1 block whitespace-nowrap text-[9px] text-white/65">
                      {item.detail}
                    </span>
                  </span>
                  <span className="hero-shortcut-icon">
                    <item.icon size={16} strokeWidth={1.7} />
                  </span>
                  <ArrowUpRight size={12} className="hero-shortcut-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center py-4">
          <a
            href="#home-categories"
            className="group inline-flex items-center gap-3 font-display text-[8px] font-semibold uppercase tracking-[0.12em] text-white/65 transition hover:text-white"
          >
            <span className="flex h-5 w-3 shrink-0 items-center justify-center rounded-full border border-orange-500/65 text-orange-400 transition group-hover:bg-orange-500 group-hover:text-black">
              <ArrowRight size={9} className="rotate-90" />
            </span>
            <span className="flex flex-col items-center gap-2">
              <span>Scroll to explore</span>
              <span className="h-px w-8 bg-orange-500/80 transition group-hover:w-10" />
            </span>
          </a>
          {/* <span className="flex items-center gap-4 font-display text-[8px] font-medium tracking-[0.12em] text-white/55">
            <ArrowRight size={11} className="rotate-180 text-orange-400" />
            <span>01 <span className="px-1 text-orange-500">/</span> 04</span>
            <ArrowRight size={11} className="text-orange-400" />
          </span> */}
        </div>
      </div>
    </section>          
  );
}
