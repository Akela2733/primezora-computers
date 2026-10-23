import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
} from "lucide-react";
import { getCatalogCategories, normalizeCategorySlug } from "@/lib/categories";
import { getStorefrontContent } from "@/lib/storefront-content";

export async function ShopCategories() {
  const [categories, content] = await Promise.all([
    getCatalogCategories(),
    getStorefrontContent(),
  ]);
  if (!content) return null;
  const categoryContent = content.home.categories;

  return (
    <section id="home-categories" data-motion-reveal className="relative overflow-hidden border-y border-white/10 bg-[#050708] py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,rgba(217,119,6,0.08),transparent_48%)]" />

      <div className="container-primezora relative grid gap-5 md:grid-cols-[minmax(145px,0.8fr)_minmax(0,2fr)] md:items-center lg:grid-cols-[210px_minmax(0,1fr)] xl:gap-7">
        <div className="flex flex-col items-start">
          <p className="mb-3 font-display text-[8px] font-semibold uppercase tracking-[0.24em] text-amber-500">
            {categoryContent.eyebrow}
          </p>
          <h2 className="font-display text-[27px] font-bold uppercase leading-[1.02] text-white sm:text-[30px]">
            {categoryContent.titleLines.map((line, index) => (
              <span key={`${index}-${line}`}>
                {line}
                {index < categoryContent.titleLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className="mt-3 max-w-55 text-[11px] leading-[1.5] text-white/55 sm:text-xs">
            {categoryContent.description}
          </p>
          <Link
            href="/shop"
            className="group mt-4 inline-flex items-center gap-2 border-b border-orange-500/60 pb-1 font-display text-[8px] font-semibold uppercase tracking-[0.14em] text-white/80 transition hover:text-orange-400"
          >
            {categoryContent.linkLabel}
            <ArrowRight size={13} className="text-orange-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div data-motion-stagger className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${normalizeCategorySlug(category.slug)}`}
                aria-label={`Shop ${category.name}`}
                data-motion-reveal
                className="home-category-card group relative isolate flex h-44 flex-col justify-end overflow-hidden rounded-sm border border-white/10 bg-[#030505] p-3 transition duration-300 hover:-translate-y-1 hover:border-orange-500/60 sm:h-48 sm:p-3.5 lg:h-48"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-20 bg-linear-to-br from-[#030505]/45 via-[#030505]/20 to-[#030505]/80 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={category.image ? { backgroundImage: `url(${category.image})` } : undefined}
                />
                <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#030505]/95 via-[#030505]/20 to-transparent" />
                <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full border border-orange-500/10 transition duration-500 group-hover:scale-110 group-hover:border-orange-500/25" />
                <div className="pointer-events-none absolute right-5 top-12 h-16 w-16 rounded-full bg-orange-500/10 blur-2xl transition group-hover:bg-orange-500/20" />

                {!category.image && (
                  <div className="absolute inset-x-0 top-7 flex justify-center text-orange-500/45 transition duration-300 group-hover:-translate-y-1 group-hover:text-orange-500/75">
                    <Cpu size={46} strokeWidth={1.1} />
                  </div>
                )}

                <div className="relative">
                  <h3 className="font-display text-[10px] font-semibold uppercase leading-[1.35] text-white sm:text-[11px]">
                    {category.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2 text-[8px] text-white/55 transition group-hover:border-orange-500/30 group-hover:text-white/90">
                    <span>{categoryContent.cardActionLabel}</span>
                    <ArrowUpRight size={12} className="text-orange-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="col-span-full self-center text-center text-xs text-white/55">
              No categories are available right now.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
