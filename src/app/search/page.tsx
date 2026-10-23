import Link from "next/link";
import { Search, X, ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { getStorefrontContent } from "@/lib/storefront-content";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types/product";
import type { StorefrontContent } from "@/lib/storefront-content";

function SearchPageContent({
  query,
  results,
  popularSearches,
  content,
}: {
  query: string;
  results: Product[];
  popularSearches: string[];
  content: StorefrontContent["search"];
}) {
  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      {/* HERO */}
      <section className="border-b border-white/[0.06] bg-[radial-gradient(circle_at_50%_0%,rgba(217,119,6,0.10),transparent_42%)]">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-display text-[9px] font-bold uppercase tracking-[0.28em] text-amber-600">
              {content.eyebrow}
            </p>

            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              {content.title}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
              {content.description}
            </p>
          </div>

          {/* SEARCH FORM */}
          <form
            action="/search"
            method="GET"
            className="mt-8 max-w-3xl"
          >
            <div className="relative">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-600"
              />

              <input
                type="search"
                name="q"
                defaultValue={query}
                autoFocus
                placeholder={content.inputPlaceholder}
                className="h-14 w-full border border-white/10 bg-white/[0.045] pl-12 pr-28 text-sm text-white/90 outline-none transition placeholder:text-white/25 focus:border-amber-600/50 focus:bg-white/[0.06]"
              />

              <button
                type="submit"
                className="absolute right-2 top-2 flex h-10 items-center justify-center bg-amber-600 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-amber-600"
              >
                {content.submitLabel}
              </button>
            </div>
          </form>

          {/* POPULAR SEARCHES */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] uppercase tracking-[0.15em] text-white/25">
              {content.popularLabel}
            </span>

            {popularSearches.map((item) => (
              <Link
                key={item}
                href={`/search?q=${encodeURIComponent(item)}`}
                className="border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/50 transition hover:border-amber-600/30 hover:text-amber-600"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!query ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center border border-amber-600/20 bg-amber-600/[0.06]">
              <Search
                size={25}
                className="text-amber-600/70"
              />
            </div>

            <h2 className="mt-6 font-display text-sm font-bold uppercase tracking-[0.12em] text-white/80">
              {content.startTitle}
            </h2>

            <p className="mt-2 max-w-md text-xs leading-5 text-white/35">
              {content.startDescription}
            </p>
          </div>
        ) : (
          <>
            {/* RESULT HEADER */}
            <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                  {content.resultsLabel}
                </p>

                <h2 className="mt-2 font-display text-lg font-bold uppercase tracking-tight text-white/90 sm:text-xl">
                  {results.length}{" "}
                  {results.length === 1
                    ? content.singularProductLabel
                    : content.pluralProductsLabel}
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  {content.resultForLabel}{" "}
                  <span className="text-amber-600">
                    &quot;{query}&quot;
                  </span>
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex w-fit items-center gap-2 border border-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 transition hover:border-amber-600/30 hover:text-amber-600"
              >
                <X size={12} />
                {content.clearLabel}
              </Link>
            </div>

            {results.length > 0 ? (
              <div data-motion-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[380px] flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center border border-white/10 bg-white/[0.03]">
                  <Search
                    size={24}
                    className="text-white/25"
                  />
                </div>

                <h2 className="mt-6 font-display text-sm font-bold uppercase tracking-[0.12em] text-white/75">
                  {content.noProductsTitle}
                </h2>

                <p className="mt-2 max-w-md text-xs leading-5 text-white/35">
                  {content.noProductsDescription.replace("{query}", query)}
                </p>

                <Link
                  href="/shop"
                  className="mt-6 inline-flex items-center gap-2 bg-amber-600 px-5 py-3 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-amber-600"
                >
                  <ArrowLeft size={13} />
                  {content.browseShopLabel}
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query =
    typeof params.q === "string"
      ? params.q.trim()
      : "";

  const [productRecords, brandRecords, categoryRecords, content] =
    await Promise.all([
      query
        ? prisma.product.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
              ],
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      prisma.product.findMany({
        distinct: ["brand"],
        select: { brand: true },
        orderBy: { brand: "asc" },
      }),
      prisma.product.findMany({
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
      getStorefrontContent(),
    ]);

  if (!content) {
    throw new Error("Storefront content is missing from the database.");
  }
  const popularSearches = Array.from(
    new Set(
      [
        ...categoryRecords.map(({ category }) => category),
        ...brandRecords.map(({ brand }) => brand),
      ]
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).slice(0, 5);

  return (
    <SearchPageContent
      query={query}
      results={(await addCustomerReviewSummaries(productRecords)).map(toProductView)}
      popularSearches={popularSearches}
      content={content.search}
    />
  );
}