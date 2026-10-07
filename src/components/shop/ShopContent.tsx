"use client";

import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo } from "react";

import type { Product } from "@/data/products";
import {
  type ShopFilterState,
  type SortOption,
} from "@/components/shop/ShopFilters";
import { ProductCard } from "@/components/shop/ProductCard";

type ShopContentProps = {
  products: Product[];
  filters: ShopFilterState;
  onChange: (filters: ShopFilterState) => void;
};

export function ShopContent({
  products,
  filters,
  onChange,
}: ShopContentProps) {

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /* Search */
    if (filters.search.trim()) {
      const search =
        filters.search.toLowerCase();

      result = result.filter((product) => {
        return (
          product.name
            .toLowerCase()
            .includes(search) ||
          product.brand
            .toLowerCase()
            .includes(search) ||
          product.category
            .toLowerCase()
            .includes(search) ||
          product.subcategory
            ?.toLowerCase()
            .includes(search) ||
          product.tags?.some((tag) =>
            tag.toLowerCase().includes(search)
          )
        );
      });
    }

    /* Category */
    if (filters.category) {
      result = result.filter(
        (product) =>
          product.category === filters.category
      );
    }

    /* Brand */
    if (filters.brand) {
      result = result.filter(
        (product) =>
          product.brand === filters.brand
      );
    }

    /* Minimum price */
    if (filters.minPrice) {
      const minimum = Number(
        filters.minPrice
      );

      if (!Number.isNaN(minimum)) {
        result = result.filter(
          (product) =>
            product.price >= minimum
        );
      }
    }

    /* Maximum price */
    if (filters.maxPrice) {
      const maximum = Number(
        filters.maxPrice
      );

      if (!Number.isNaN(maximum)) {
        result = result.filter(
          (product) =>
            product.price <= maximum
        );
      }
    }

    /* Stock */
    if (filters.inStock) {
      result = result.filter(
        (product) => product.inStock
      );
    }

    /* Sorting */
    switch (filters.sort) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        break;

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

      case "featured":
      default:
        result.sort((a, b) => {
          if (
            a.featured === b.featured
          ) {
            return 0;
          }

          return a.featured ? -1 : 1;
        });
        break;
    }

    return result;
  }, [products, filters]);

  const hasSearch =
    filters.search.trim().length > 0;

  const clearSearch = () => {
    onChange({
      ...filters,
      search: "",
    });
  };

  return (
    <div>
      {/* Search + Sort */}
      <div className="mb-7 flex flex-col gap-3 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
          />

          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              onChange({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Search products..."
            className="h-11 w-full border border-white/10 bg-white/[0.02] pl-9 pr-9 text-[10px] text-white outline-none transition placeholder:text-white/20 focus:border-orange-500/40"
          />

          {hasSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-orange-400"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="hidden text-[8px] uppercase tracking-[0.15em] text-white/25 sm:block">
            Sort
          </span>

          <div className="relative">
            <select
              value={filters.sort}
              onChange={(event) =>
                onChange({
                  ...filters,
                  sort: event.target
                    .value as SortOption,
                })
              }
              className="h-11 appearance-none border border-white/10 bg-[#080b0d] px-3 pr-8 text-[9px] text-white/60 outline-none focus:border-orange-500/40"
            >
              <option value="featured">
                Featured
              </option>

              <option value="newest">
                Newest
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="rating">
                Highest Rated
              </option>
            </select>

            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30">
              ↓
            </span>
          </div>
        </div>
      </div>

      {/* Active search */}
      {hasSearch && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-[0.12em] text-white/25">
            Search:
          </span>

          <button
            type="button"
            onClick={clearSearch}
            className="flex items-center gap-1.5 border border-orange-500/20 bg-orange-500/[0.06] px-2.5 py-1.5 text-[8px] text-orange-400"
          >
            &quot;{filters.search}&quot;

            <X size={10} />
          </button>
        </div>
      )}

      {/* Products */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <EmptyProducts
          onClear={() =>
            onChange({
              search: "",
              category: "",
              brand: "",
              minPrice: "",
              maxPrice: "",
              inStock: false,
              sort: "featured",
            })
          }
        />
      )}
    </div>
  );
}

function EmptyProducts({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center border border-white/[0.07] bg-white/[0.015] px-6 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center border border-white/10 text-white/25">
        <SlidersHorizontal size={18} />
      </div>

      <h3 className="text-lg font-bold text-white/80">
        No products found
      </h3>

      <p className="mt-2 max-w-sm text-[10px] leading-5 text-white/30">
        We couldn&apos;t find products matching
        your current search and filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-6 h-10 bg-orange-500 px-5 text-[8px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
      >
        Clear All Filters
      </button>
    </div>
  );
}