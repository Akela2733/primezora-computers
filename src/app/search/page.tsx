import Link from "next/link";
import { Search, X, ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types/product";

function SearchPageContent({
  query,
  results,
}: {
  query: string;
  results: Product[];
}) {

  const popularSearches = [
    "RTX 4060",
    "Ryzen",
    "Gaming",
    "Keyboard",
    "Mouse",
  ];

  return (
    <main className="min-h-screen bg-[#05080b] text-white">
      {/* HERO */}
      <section className="border-b border-white/[0.06] bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.10),transparent_42%)]">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-display text-[9px] font-bold uppercase tracking-[0.28em] text-orange-400">
              PRIMEZORA / SEARCH
            </p>

            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl lg:text-5xl">
              Find Your Gear
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
              Search PC components, gaming accessories and technology
              products available at Primezora Technologies.
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
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-400"
              />

              <input
                type="search"
                name="q"
                defaultValue={query}
                autoFocus
                placeholder="Search products, brands or categories..."
                className="h-14 w-full border border-white/10 bg-white/[0.045] pl-12 pr-28 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/50 focus:bg-white/[0.06]"
              />

              <button
                type="submit"
                className="absolute right-2 top-2 flex h-10 items-center justify-center bg-orange-500 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-orange-400"
              >
                Search
              </button>
            </div>
          </form>

          {/* POPULAR SEARCHES */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] uppercase tracking-[0.15em] text-white/25">
              Popular:
            </span>

            {popularSearches.map((item) => (
              <Link
                key={item}
                href={`/search?q=${encodeURIComponent(item)}`}
                className="border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/50 transition hover:border-orange-500/30 hover:text-orange-300"
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
            <div className="flex h-16 w-16 items-center justify-center border border-orange-500/20 bg-orange-500/[0.06]">
              <Search
                size={25}
                className="text-orange-400/70"
              />
            </div>

            <h2 className="mt-6 font-display text-sm font-bold uppercase tracking-[0.12em] text-white/80">
              Start Searching
            </h2>

            <p className="mt-2 max-w-md text-xs leading-5 text-white/35">
              Search for a product, brand or category to explore the
              Primezora catalog.
            </p>
          </div>
        ) : (
          <>
            {/* RESULT HEADER */}
            <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                  Search results
                </p>

                <h2 className="mt-2 font-display text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                  {results.length}{" "}
                  {results.length === 1 ? "Product" : "Products"}
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Results for{" "}
                  <span className="text-orange-300">
                    &quot;{query}&quot;
                  </span>
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex w-fit items-center gap-2 border border-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 transition hover:border-orange-500/30 hover:text-orange-300"
              >
                <X size={12} />
                Clear Search
              </Link>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                  No Products Found
                </h2>

                <p className="mt-2 max-w-md text-xs leading-5 text-white/35">
                  We couldn&apos;t find anything matching &quot;{query}&quot;.
                  Try another product name, brand or category.
                </p>

                <Link
                  href="/shop"
                  className="mt-6 inline-flex items-center gap-2 bg-orange-500 px-5 py-3 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-orange-400"
                >
                  <ArrowLeft size={13} />
                  Browse Shop
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

  const productRecords = query
    ? await prisma.product.findMany({
        where: {
          inStock: true,
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              brand: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  return (
    <SearchPageContent
      query={query}
      results={productRecords.map(toProductView)}
    />
  );
}