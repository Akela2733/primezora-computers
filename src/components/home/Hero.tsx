import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { getStorefrontContent } from "@/lib/storefront-content";

const benefitIcons: Record<string, LucideIcon> = {
  CreditCard,
  ShieldCheck,
  Truck,
};

export async function Hero() {
  const content = await getStorefrontContent();
  if (!content) return null;

  const hero = content.home.hero;

  return (
    <section className="relative isolate overflow-hidden bg-[#030505] text-white/90">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-[68%_center] sm:bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(hero.image)})` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#030505]/85 via-[#030505]/55 to-[#030505]/5" />
      <div className="absolute inset-0 bg-linear-to-t from-[#030505]/70 via-transparent to-[#030505]/10" />
      <div className="absolute inset-0 bg-[#030505]/10 sm:bg-transparent" />

      <div className="container-primezora relative flex min-h-[720px] flex-col justify-between gap-12 pb-7 pt-20 sm:min-h-[680px] sm:pt-24 lg:min-h-[min(760px,calc(100svh-120px))] lg:pt-24">
        <div className="max-w-[570px]">
          <p className="mb-5 whitespace-pre-line font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-amber-600/80 sm:text-[10px]">
            {hero.eyebrow}
          </p>

          <h1 className="font-display text-[38px] font-bold uppercase leading-[1.08] text-white/90 sm:text-6xl lg:text-[64px]">
            {hero.titleLines.map((line, index) => (
              <span
                key={`${index}-${line}`}
                className={index === hero.accentLine ? "text-amber-600" : undefined}
              >
                {line}
                {index < hero.titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-[390px] text-sm leading-6 text-white/70 sm:text-base">
            {hero.description}
          </p>

          <Link
            href={hero.actionHref}
            className="group mt-7 inline-flex h-11 items-center gap-3 border border-amber-600/80 bg-[#030505]/20 px-5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-white/90 transition hover:bg-amber-600 hover:text-[#030505]"
          >
            {hero.actionLabel}
          </Link>
        </div>

        <div className="grid max-w-[760px] grid-cols-1 border-t border-white/15 pt-4 sm:grid-cols-3 sm:pt-5">
          {hero.benefits.map((benefit, index) => {
            const Icon = benefitIcons[benefit.icon];
            if (!Icon) {
              throw new Error(`Unknown storefront benefit icon: ${benefit.icon}`);
            }

            return (
              <div
                key={`${benefit.title}-${index}`}
                className={`flex items-center gap-3 py-2 sm:py-0 sm:pr-5 ${
                  index > 0 ? "sm:border-l sm:border-white/10 sm:pl-5" : ""
                }`}
              >
                <Icon size={21} className="shrink-0 text-amber-600" strokeWidth={1.8} />
                <div>
                  <p className="font-display text-[10px] font-semibold text-white/90 sm:text-[11px]">
                    {benefit.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/50">{benefit.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
