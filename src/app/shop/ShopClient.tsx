"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Search,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import type { Product } from "@/types/product";
import type { StorefrontContent } from "@/lib/storefront-content";
import { ProductCard } from "@/components/shop/ProductCard";

type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCategories: string[];
  productCount: number;
};

type ShopClientProps = {
  products: Product[];
  categories: Category[];
  brands: string[];
  content: StorefrontContent["shop"];
  hero: StorefrontContent["home"]["hero"];
  categoryContent: StorefrontContent["home"]["categories"];
};

type ProductTab = "featured" | "newest" | "sale";

function normalizeCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const benefitIcons = {
  Truck,
  ShieldCheck,
  CreditCard,
  BadgeCheck,
};

export default function ShopClient({
  products,
  categories,
  brands,
  content,
  hero,
  categoryContent,
}: ShopClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [activeTab, setActiveTab] = useState<ProductTab>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minimumRating, setMinimumRating] = useState(0);
  const [priceLimit, setPriceLimit] = useState(() =>
    Math.max(0, ...products.map((product) => product.price))
  );

  const maxPrice = Math.max(0, ...products.map((product) => product.price));
  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const selectedCategory = categories.find((item) => item.id === category);
    const result = products.filter((product) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [product.name, product.brand, product.category, product.slug].some(
          (value) => value.toLowerCase().includes(query)
        );
      const matchesCategory =
        category === "ALL" ||
        Boolean(
          selectedCategory?.productCategories.includes(
            normalizeCategory(product.category)
          )
        );
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchesStock =
        product.price <= priceLimit &&
        (!inStockOnly ||
          (product.inStock && (product.stockQuantity ?? 0) > 0));
      const matchesRating = product.rating >= minimumRating;
      const matchesTab =
        activeTab !== "sale" ||
        (product.oldPrice !== null &&
          product.oldPrice !== undefined &&
          product.oldPrice > product.price);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesStock &&
        matchesRating &&
        matchesTab
      );
    });

    switch (sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        break;
      default:
        result.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
        );
    }

    return result;
  }, [
    activeTab,
    categories,
    category,
    inStockOnly,
    minimumRating,
    priceLimit,
    products,
    search,
    selectedBrands,
    sort,
  ]);

  const clearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setSelectedBrands([]);
    setInStockOnly(false);
    setMinimumRating(0);
    setPriceLimit(maxPrice);
    setActiveTab("featured");
    setSort("featured");
  };

  const toggleBrand = (selectedBrand: string) => {
    setSelectedBrands((current) =>
      current.includes(selectedBrand)
        ? current.filter((item) => item !== selectedBrand)
        : [...current, selectedBrand]
    );
  };

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5 lg:px-8">
        <aside className="space-y-5 border border-white/10 bg-[#050707] p-4 lg:sticky lg:top-24 lg:self-start">
          <label className="flex h-10 items-center gap-2 border border-white/10 bg-black/30 px-3">
            <Search size={14} className="shrink-0 text-orange-500" />
            <input
              type="search"
              aria-label={content.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={content.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-white/35"
            />
          </label>

          <section aria-labelledby="shop-categories-filter">
            <h2
              id="shop-categories-filter"
              className="mb-3 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/85"
            >
              {categoryContent.eyebrow}
            </h2>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCategory("ALL")}
                aria-pressed={category === "ALL"}
                className={`flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-[10px] transition ${
                  category === "ALL"
                    ? "bg-orange-500/15 text-orange-300"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{content.allCategoriesLabel}</span>
                <span>{products.length}</span>
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={`flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-[10px] transition ${
                    category === item.id
                      ? "bg-orange-500/15 text-orange-300"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate pr-2">{item.name}</span>
                  <span>{item.productCount}</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="shop-price-filter" className="border-t border-white/10 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2
                id="shop-price-filter"
                className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/85"
              >
                Price Range
              </h2>
              <span className="text-[9px] text-orange-400">
                LKR {priceLimit.toLocaleString("en-LK")}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPrice || 1}
              step={Math.max(1, Math.floor(maxPrice / 100))}
              value={Math.min(priceLimit, maxPrice || 1)}
              onChange={(event) => setPriceLimit(Number(event.target.value))}
              aria-label="Maximum product price"
              className="w-full accent-orange-500"
            />
          </section>

          <section aria-labelledby="shop-brands-filter" className="border-t border-white/10 pt-4">
            <h2
              id="shop-brands-filter"
              className="mb-3 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/85"
            >
              {content.allBrandsLabel}
            </h2>
            <div className="max-h-44 space-y-2 overflow-y-auto">
              {brands.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center justify-between gap-2 text-[10px] text-white/65"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(item)}
                      onChange={() => toggleBrand(item)}
                      className="accent-orange-500"
                    />
                    <span className="truncate">{item}</span>
                  </span>
                  <span>{brandCounts.get(item) ?? 0}</span>
                </label>
              ))}
            </div>
          </section>

          <label className="flex cursor-pointer items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-white/65">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="accent-orange-500"
            />
            In Stock Only
          </label>

          <section aria-labelledby="shop-rating-filter" className="border-t border-white/10 pt-4">
            <h2
              id="shop-rating-filter"
              className="mb-3 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/85"
            >
              Rating
            </h2>
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <label
                  key={rating}
                  className="flex cursor-pointer items-center justify-between gap-2 text-[10px] text-white/65"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shop-minimum-rating"
                      checked={minimumRating === rating}
                      onChange={() => setMinimumRating(rating)}
                      className="accent-orange-500"
                    />
                    <span className="flex items-center">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={10}
                          className={
                            index < rating
                              ? "fill-orange-400 text-orange-400"
                              : "text-white/20"
                          }
                        />
                      ))}
                      <span className="ml-1">& up</span>
                    </span>
                  </span>
                  <span>
                    {products.filter((product) => product.rating >= rating).length}
                  </span>
                </label>
              ))}
              {minimumRating > 0 && (
                <button
                  type="button"
                  onClick={() => setMinimumRating(0)}
                  className="text-[9px] text-orange-400 hover:text-orange-300"
                >
                  Clear rating
                </button>
              )}
            </div>
          </section>

          {(search ||
            category !== "ALL" ||
            selectedBrands.length > 0 ||
            inStockOnly ||
            minimumRating > 0 ||
            priceLimit < maxPrice) && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full border border-orange-500/40 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400 transition hover:bg-orange-500 hover:text-black"
            >
              {content.clearFiltersLabel}
            </button>
          )}
        </aside>

        <div className="min-w-0 space-y-7">
          <section className="relative isolate min-h-[310px] overflow-hidden rounded-md border border-white/10 sm:min-h-[360px] lg:min-h-[400px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[#050708] bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("/banners/hero%20section%20background%20image.png")',
              }}
            />
            <div className="absolute inset-0 -z-0 bg-linear-to-r from-[#030505]/95 via-[#030505]/70 to-[#030505]/10" />
            <div className="relative flex min-h-[310px] max-w-2xl flex-col items-start justify-center p-6 sm:min-h-[360px] sm:p-9 lg:min-h-[400px] lg:p-12">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.24em] text-orange-400">
                {content.eyebrow}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-[1.04] tracking-tight text-white sm:text-5xl">
                {content.titleLines.map((line, index) => (
                  <span key={`${index}-${line}`}>
                    {line}
                    {index < content.titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="mt-4 max-w-lg text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">
                {content.description}
              </p>
              <a
                href="#shop-products"
                className="mt-5 inline-flex h-10 items-center gap-3 rounded-sm bg-orange-500 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#090909] transition hover:bg-orange-400"
              >
                {hero.actionLabel}
                <ArrowRight size={14} />
              </a>
            </div>
            <div className="absolute bottom-3 right-4 rounded-sm bg-black/45 px-2 py-1 text-[8px] text-white/70">
              {products.length} {content.countLabel}
            </div>
          </section>

          {hero.benefits.length > 0 && (
            <div className="grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 bg-white/[0.015] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {hero.benefits.map((benefit) => {
                const Icon =
                  benefitIcons[benefit.icon as keyof typeof benefitIcons] ??
                  BadgeCheck;
                return (
                  <div
                    key={`${benefit.title}-${benefit.subtitle}`}
                    className="flex items-center gap-3 px-4 py-3 sm:justify-center sm:px-2"
                  >
                    <Icon size={19} className="shrink-0 text-orange-500" />
                    <div>
                      <p className="font-display text-[9px] font-semibold text-white/90">
                        {benefit.title}
                      </p>
                      <p className="mt-0.5 text-[8px] text-white/50">
                        {benefit.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <section aria-labelledby="shop-category-heading">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-[8px] font-bold uppercase tracking-[0.18em] text-orange-500">
                  {categoryContent.eyebrow}
                </p>
                <h2
                  id="shop-category-heading"
                  className="mt-1 font-display text-lg font-bold uppercase text-white sm:text-xl"
                >
                  {categoryContent.titleLines.join(" ")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCategory("ALL")}
                className="inline-flex items-center gap-1 text-[9px] text-white/65 transition hover:text-orange-400"
              >
                {categoryContent.linkLabel}
                <ArrowRight size={12} className="text-orange-400" />
              </button>
            </div>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {categories.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={category === item.id}
                    className={`group relative isolate flex h-32 items-end overflow-hidden rounded-sm border bg-[#070a0b] p-3 text-left transition hover:-translate-y-0.5 hover:border-orange-500/60 sm:h-36 ${
                      category === item.id
                        ? "border-orange-500/70"
                        : "border-white/10"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 bg-cover bg-center transition duration-500 group-hover:scale-105"
                      style={
                        item.image
                          ? { backgroundImage: `url("${item.image}")` }
                          : undefined
                      }
                    />
                    <span className="absolute inset-0 -z-0 bg-linear-to-t from-black/95 via-black/25 to-transparent" />
                    <span className="relative z-10 min-w-0">
                      <span className="block truncate font-display text-[10px] font-semibold uppercase text-white">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-[8px] text-white/60">
                        {item.productCount} products
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="border border-white/10 p-5 text-xs text-white/55">
                No categories are available right now.
              </p>
            )}
          </section>

          <section id="shop-products" aria-labelledby="shop-products-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="font-display text-[8px] font-bold uppercase tracking-[0.18em] text-orange-500">
                  {content.showingLabel} {filteredProducts.length}{" "}
                  {content.productsLabel}
                </p>
                <h2
                  id="shop-products-heading"
                  className="mt-1 font-display text-xl font-bold uppercase text-white sm:text-2xl"
                >
                  {activeTab === "sale" ? (
                    <>On <span className="text-orange-500">Sale</span></>
                  ) : (
                    <>Featured <span className="text-orange-500">Products</span></>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1" role="tablist" aria-label="Product collection">
                  {([
                    ["featured", content.sortLabels.featured],
                    ["newest", content.sortLabels.newest],
                    ["sale", "On Sale"],
                  ] as const).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      onClick={() => {
                        setActiveTab(tab);
                        if (tab === "newest") setSort("newest");
                        else if (tab === "featured") setSort("featured");
                      }}
                      className={`px-2 py-2 text-[8px] transition sm:text-[9px] ${
                        activeTab === tab
                          ? "text-orange-400"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="sr-only" htmlFor="shop-sort">
                  Sort products
                </label>
                <select
                  id="shop-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-8 max-w-32 border border-white/10 bg-[#060808] px-2 text-[8px] text-white/75 outline-none focus:border-orange-500/50"
                >
                  <option value="featured">{content.sortLabels.featured}</option>
                  <option value="newest">{content.sortLabels.newest}</option>
                  <option value="price-low">{content.sortLabels.priceLow}</option>
                  <option value="price-high">{content.sortLabels.priceHigh}</option>
                  <option value="rating">{content.sortLabels.rating}</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showAddToCart
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center border border-white/10 bg-white/[0.015] px-5 text-center">
                <p className="text-sm font-medium text-white/70">
                  {content.emptyTitle}
                </p>
                <p className="mt-2 text-xs text-white/45">
                  {content.emptyDescription}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 border border-orange-500/50 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-orange-400 transition hover:bg-orange-500 hover:text-black"
                >
                  {content.resetFiltersLabel}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
