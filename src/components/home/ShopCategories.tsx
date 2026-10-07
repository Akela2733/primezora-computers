import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Gamepad2,
  Keyboard,
  Mouse,
  type LucideIcon,
} from "lucide-react";
import {
  getCategoryHref,
  getSupportedCategories,
} from "@/lib/categories";

const categoryIcons: Record<string, LucideIcon> = {
  gaming: Gamepad2,
  "pc-components": Cpu,
  keyboards: Keyboard,
  mice: Mouse,
};

const categories = getSupportedCategories().flatMap((category) =>
  category.homepage ? [{ ...category, homepage: category.homepage }] : []
);

export function ShopCategories() {
  return (
    <section className="relative overflow-hidden border-y border-amber-500/10 bg-[#040607] py-12 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,rgba(190,103,25,0.08),transparent_48%)]" />

      <div className="container-primezora relative grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center xl:gap-9">
        <div className="flex flex-col items-start">
          <p className="mb-4 font-display text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-400/80">
            Shop by category
          </p>
          <h2 className="font-display text-[30px] font-bold uppercase leading-[1.05] text-white sm:text-[34px]">
            Find What
            <br />
            You Need
          </h2>
          <p className="mt-4 max-w-55 text-xs leading-5 text-white/55 sm:text-[13px]">
            From gaming gear to PC components, find what powers your setup.
          </p>
          <Link
            href="/shop"
            className="group mt-5 inline-flex items-center gap-2 font-display text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-400 transition hover:text-amber-200"
          >
            Explore all
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Cpu;
            const image = category.homepage.image;

            return (
              <Link
                key={category.slug}
                href={getCategoryHref(category)}
                aria-label={`Shop ${category.homepage.label}`}
                className="group relative isolate flex h-55 flex-col justify-end overflow-hidden rounded-sm border border-white/10 bg-[#080c10] p-3.5 transition duration-300 hover:-translate-y-1 hover:border-amber-500/55 sm:h-60 sm:p-4"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-20 bg-linear-to-br from-[#151719] via-[#080b0e] to-[#100d09] bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={image ? { backgroundImage: `url(${image})` } : undefined}
                />
                <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030506] via-[#030506]/70 to-[#030506]/10" />
                <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full border border-amber-200/8 transition duration-500 group-hover:scale-110 group-hover:border-amber-400/20" />
                <div className="pointer-events-none absolute right-5 top-12 h-16 w-16 rounded-full bg-amber-500/8 blur-2xl transition group-hover:bg-amber-500/16" />

                {!image && (
                  <div className="absolute inset-x-0 top-7 flex justify-center text-amber-100/45 transition duration-300 group-hover:-translate-y-1 group-hover:text-amber-200/75">
                    <Icon size={46} strokeWidth={1.1} />
                  </div>
                )}

                <div className="relative">
                  <h3 className="font-display text-[11px] font-semibold uppercase leading-[1.35] text-white sm:text-xs">
                    {category.homepage.label}
                  </h3>
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[9px] text-white/45 transition group-hover:border-amber-500/30 group-hover:text-white/80">
                    <span>Shop now</span>
                    <ArrowUpRight size={13} className="text-amber-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
