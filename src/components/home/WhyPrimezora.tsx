import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getStorefrontContent } from "@/lib/storefront-content";

export async function WhyPrimezora() {
  const content = await getStorefrontContent();
  if (!content) return null;

  const why = content.home.why;
  const backgroundImage =
    why.image === "/banners/why%20primezora.jfif"
      ? "/banners/banner%204.png"
      : why.image;

  return (
    <section className="scroll-reveal relative isolate overflow-hidden border-y border-amber-600/15 bg-[#030505] text-white/90">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-[38%_center] md:bg-left"
        style={{
          backgroundImage: `url(${JSON.stringify(backgroundImage)})`,
        }}
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#030505]/15 via-[#030505]/55 via-45% to-[#030505]/95" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/75 via-transparent to-[#030505]/20" />

      <div className="container-primezora relative grid min-h-[280px] gap-6 py-8 sm:min-h-[320px] sm:py-10 md:min-h-[250px] md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-7 md:py-6">
        <div className="md:col-start-2">
          <p className="mb-3 font-display text-[8px] font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {why.eyebrow}
          </p>
          <h2 className="font-display text-[27px] font-bold uppercase leading-[1.05] sm:text-[32px] md:text-[24px]">
            {why.titleLines.map((line, index) => (
              <span key={`${index}-${line}`}>
                {line}
                {index < why.titleLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className="mt-3 max-w-[250px] text-[11px] leading-[1.55] text-white/60 sm:text-xs">
            {why.description}
          </p>
          <Link
            href={why.actionHref}
            className="group mt-4 inline-flex h-9 items-center gap-3 border border-amber-600/60 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] text-white/90 transition hover:bg-amber-600 hover:text-[#030505]"
          >
            {why.actionLabel}
            <ArrowRight size={12} className="text-amber-600 transition-transform group-hover:translate-x-1 group-hover:text-[#030505]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
