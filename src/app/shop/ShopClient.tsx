"use client";

import { useMemo, useState } from "react";

import type { Product } from "@/types/product";
import type { StorefrontContent } from "@/lib/storefront-content";

import { ProductCard } from "@/components/shop/ProductCard";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ShopClientProps = {
  products: Product[];
  categories: Category[];
  brands: string[];
  content: StorefrontContent["shop"];
};

export default function ShopClient({
  products,
  categories,
  brands,
  content,
}: ShopClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("ALL");
  const [brand, setBrand] =
    useState("ALL");

  const [sort, setSort] =
    useState("featured");

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /*
    Search
    */

    if (search.trim()) {
      const query =
        search.toLowerCase().trim();

      result = result.filter((product) =>
        [
          product.name,
          product.brand,
          product.category,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(query)
        )
      );
    }

    /*
    Category
    */

    if (category !== "ALL") {
      result = result.filter(
        (product) =>
          product.category.toLowerCase() ===
          category.toLowerCase()
      );
    }

    /*
    Brand
    */

    if (brand !== "ALL") {
      result = result.filter(
        (product) =>
          product.brand.toLowerCase() ===
          brand.toLowerCase()
      );
    }

    /*
    Sorting
    */

    switch (sort) {
      case "price-low":
        result.sort(
          (a, b) => a.price - b.price
        );
        break;

      case "price-high":
        result.sort(
          (a, b) => b.price - a.price
        );
        break;

      case "rating":
        result.sort(
          (a, b) => b.rating - a.rating
        );
        break;

      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        break;

      case "featured":
      default:
        result.sort(
          (a, b) =>
            Number(b.featured) -
            Number(a.featured)
        );
        break;
    }

    return result;
  }, [
    products,
    search,
    category,
    brand,
    sort,
  ]);

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-white/[0.07]">

        <div className="container-primezora py-14 sm:py-20">

          <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-amber-600">
            {content.eyebrow}
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                {content.titleLines.map((line, index) => (
                  <span
                    key={`${index}-${line}`}
                    className={index > 0 ? "text-white/35" : undefined}
                  >
                    {line}
                    {index < content.titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>

              <p className="mt-5 max-w-xl text-xs leading-6 text-white/35 sm:text-sm">
                {content.description}
              </p>
            </div>

            <div className="text-left lg:text-right">
              <p className="font-display text-2xl font-bold text-amber-600">
                {products.length}
              </p>

              <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-white/30">
                {content.countLabel}
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SHOP CONTROLS
      ===================================================== */}

      <section className="border-b border-white/[0.07]">

        <div className="container-primezora py-5">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}

            <div className="w-full lg:max-w-md">

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={content.searchPlaceholder}
                className="h-11 w-full border border-white/[0.1] bg-white/[0.02] px-4 text-xs text-white/90 outline-none placeholder:text-white/25 focus:border-amber-600/50"
              />

            </div>


            {/* Filters */}

            <div className="grid grid-cols-2 gap-2 sm:flex">

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="h-11 border border-white/[0.1] bg-[#030505] px-3 text-[9px] uppercase tracking-[0.1em] text-white/60 outline-none focus:border-amber-600/50"
              >
                <option value="ALL">
                  {content.allCategoriesLabel}
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>


              <select
                value={brand}
                onChange={(event) =>
                  setBrand(event.target.value)
                }
                className="h-11 border border-white/[0.1] bg-[#030505] px-3 text-[9px] uppercase tracking-[0.1em] text-white/60 outline-none focus:border-amber-600/50"
              >
                <option value="ALL">
                  {content.allBrandsLabel}
                </option>

                {brands.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>


              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value)
                }
                className="col-span-2 h-11 border border-white/[0.1] bg-[#030505] px-3 text-[9px] uppercase tracking-[0.1em] text-white/60 outline-none focus:border-amber-600/50 sm:col-span-1"
              >
                <option value="featured">
                  {content.sortLabels.featured}
                </option>

                <option value="newest">
                  {content.sortLabels.newest}
                </option>

                <option value="price-low">
                  {content.sortLabels.priceLow}
                </option>

                <option value="price-high">
                  {content.sortLabels.priceHigh}
                </option>

                <option value="rating">
                  {content.sortLabels.rating}
                </option>
              </select>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section className="container-primezora py-10 sm:py-14">

        <div className="mb-6 flex items-center justify-between">

          <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
            {content.showingLabel}{" "}
            <span className="text-white/70">
              {filteredProducts.length}
            </span>{" "}
            {content.productsLabel}
          </p>

          {(search ||
            category !== "ALL" ||
            brand !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
                setBrand("ALL");
              }}
              className="text-[8px] font-bold uppercase tracking-[0.15em] text-amber-600 hover:text-amber-600"
            >
              {content.clearFiltersLabel}
            </button>
          )}

        </div>


        {filteredProducts.length > 0 ? (

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">

            {filteredProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              )
            )}

          </div>

        ) : (

          <div className="flex min-h-[350px] flex-col items-center justify-center border border-white/[0.07] bg-white/[0.015]">

            <p className="text-xs font-medium text-white/50">
              {content.emptyTitle}
            </p>

            <p className="mt-2 text-[9px] text-white/25">
              {content.emptyDescription}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
                setBrand("ALL");
              }}
              className="mt-5 border border-amber-600/30 px-5 py-2.5 text-[8px] font-bold uppercase tracking-[0.16em] text-amber-600 transition hover:bg-amber-600 hover:text-black"
            >
              {content.resetFiltersLabel}
            </button>

          </div>

        )}

      </section>

    </main>
  );
}