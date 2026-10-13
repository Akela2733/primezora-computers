import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  RefreshCw,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { getStorefrontContent } from "@/lib/storefront-content";

const reasonIcons: Record<string, LucideIcon> = {
  BadgeCheck,
  Headphones,
  RefreshCw,
  Truck,
};

export async function WhyPrimezora() {
  const content = await getStorefrontContent();
  if (!content) return null;

  const why = content.home.why;

  return (
    <section className="relative isolate overflow-hidden border-y border-amber-600/15 bg-[#030505] text-white/90">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-[68%_center]"
        style={{ backgroundImage: `url(${JSON.stringify(why.image)})` }}
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#030505] via-[#030505]/95 via-55% to-[#030505]/15" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/75 via-transparent to-[#030505]/15" />

      <div className="container-primezora relative grid min-h-68 gap-6 py-8 sm:py-10 lg:grid-cols-[0.95fr_1.1fr_1.35fr] lg:items-stretch lg:gap-5 lg:py-7">
        <div className="flex flex-col items-start justify-center border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <p className="mb-3 font-display text-[8px] font-semibold uppercase tracking-[0.24em] text-amber-600/80">
            {why.eyebrow}
          </p>
          <h2 className="font-display text-[27px] font-bold uppercase leading-[1.05] sm:text-[32px]">
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

        <div className="grid grid-cols-2">
          {why.reasons.map((reason, index) => {
            const Icon = reasonIcons[reason.icon];
            if (!Icon) {
              throw new Error(`Unknown storefront reason icon: ${reason.icon}`);
            }

            return (
              <div
                key={`${reason.title}-${index}`}
                className={`flex flex-col justify-center gap-1.5 px-3 py-3 sm:px-4 ${
                  index % 2 === 1 ? "border-l border-white/10" : ""
                } ${index > 1 ? "border-t border-white/10" : ""}`}
              >
                <Icon size={23} strokeWidth={1.7} className="mb-1 text-amber-600" />
                <h3 className="font-display text-[9px] font-semibold leading-[1.35] text-white/90 sm:text-[10px]">
                  {reason.title}
                </h3>
                <p className="text-[8px] leading-[1.4] text-white/45 sm:text-[9px]">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </section>
  );
}
