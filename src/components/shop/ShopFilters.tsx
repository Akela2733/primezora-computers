"use client";

import {
  Check,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/data/products";

export type SortOption =
  | "featured"
  | "newest"
  | "price-low"
  | "price-high"
  | "rating";

export type ShopFilterState = {
  search: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: SortOption;
};

type ShopFiltersProps = {
  products: Product[];
  filters: ShopFilterState;
  onChange: (filters: ShopFilterState) => void;
  resultCount: number;
};

const sortOptions: {
  value: SortOption;
  label: string;
}[] = [
  {
    value: "featured",
    label: "Featured",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "price-low",
    label: "Price: Low to High",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
  },
  {
    value: "rating",
    label: "Highest Rated",
  },
];

export function ShopFilters({
  products,
  filters,
  onChange,
  resultCount,
}: ShopFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.category))
    ).sort();
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.brand))
    ).sort();
  }, [products]);

  const updateFilter = <K extends keyof ShopFilterState>(
    key: K,
    value: ShopFilterState[K]
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      sort: "featured",
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "" ||
    filters.brand !== "" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.inStock;

  const filterContent = (
    <div className="space-y-7">
      {/* Category */}
      <FilterGroup title="Category">
        <div className="space-y-1">
          <FilterButton
            active={filters.category === ""}
            onClick={() =>
              updateFilter("category", "")
            }
          >
            All Categories
          </FilterButton>

          {categories.map((category) => (
            <FilterButton
              key={category}
              active={filters.category === category}
              onClick={() =>
                updateFilter("category", category)
              }
            >
              {category}
            </FilterButton>
          ))}
        </div>
      </FilterGroup>

      {/* Brand */}
      <FilterGroup title="Brand">
        <div className="space-y-1">
          <FilterButton
            active={filters.brand === ""}
            onClick={() =>
              updateFilter("brand", "")
            }
          >
            All Brands
          </FilterButton>

          {brands.map((brand) => (
            <FilterButton
              key={brand}
              active={filters.brand === brand}
              onClick={() =>
                updateFilter("brand", brand)
              }
            >
              {brand}
            </FilterButton>
          ))}
        </div>
      </FilterGroup>

      {/* Price */}
      <FilterGroup title="Price Range">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1.5 block text-[8px] uppercase tracking-[0.12em] text-white/25">
              Minimum
            </label>

            <input
              type="number"
              value={filters.minPrice}
              onChange={(event) =>
                updateFilter(
                  "minPrice",
                  event.target.value
                )
              }
              placeholder="0"
              className="h-9 w-full border border-white/10 bg-white/[0.02] px-2.5 text-[10px] text-white outline-none transition focus:border-orange-500/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[8px] uppercase tracking-[0.12em] text-white/25">
              Maximum
            </label>

            <input
              type="number"
              value={filters.maxPrice}
              onChange={(event) =>
                updateFilter(
                  "maxPrice",
                  event.target.value
                )
              }
              placeholder="500000"
              className="h-9 w-full border border-white/10 bg-white/[0.02] px-2.5 text-[10px] text-white outline-none transition focus:border-orange-500/50"
            />
          </div>
        </div>
      </FilterGroup>

      {/* Availability */}
      <FilterGroup title="Availability">
        <button
          type="button"
          onClick={() =>
            updateFilter(
              "inStock",
              !filters.inStock
            )
          }
          className="flex w-full items-center justify-between py-1 text-left"
        >
          <span className="text-[10px] text-white/55">
            In Stock Only
          </span>

          <span
            className={`flex h-4 w-4 items-center justify-center border transition ${
              filters.inStock
                ? "border-orange-500 bg-orange-500 text-black"
                : "border-white/15 bg-transparent"
            }`}
          >
            {filters.inStock && (
              <Check size={10} />
            )}
          </span>
        </button>
      </FilterGroup>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex h-10 w-full items-center justify-center gap-2 border border-white/10 text-[8px] font-bold uppercase tracking-[0.16em] text-white/40 transition hover:border-orange-500/40 hover:text-orange-400"
        >
          <X size={12} />
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop controls */}
      <div className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={13}
              className="text-orange-400"
            />

            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
              Filters
            </span>
          </div>

          <span className="text-[8px] text-white/25">
            {resultCount} products
          </span>
        </div>

        {filterContent}
      </div>

      {/* Mobile controls */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 items-center gap-2 border border-white/10 px-4 text-[8px] font-bold uppercase tracking-[0.15em] text-white/60"
          >
            <SlidersHorizontal size={12} />
            Filters
          </button>

          <span className="text-[8px] text-white/25">
            {resultCount} products
          </span>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-[100]">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto border-l border-white/10 bg-[#070a0d] p-5 shadow-2xl">
              <div className="mb-7 flex items-center justify-between border-b border-white/[0.07] pb-4">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.22em] text-orange-400">
                    Primezora
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Filters
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="flex h-8 w-8 items-center justify-center border border-white/10 text-white/50 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {filterContent}

              <button
                type="button"
                onClick={() =>
                  setMobileOpen(false)
                }
                className="mt-8 h-11 w-full bg-orange-500 text-[8px] font-bold uppercase tracking-[0.16em] text-black"
              >
                Show {resultCount} Products
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[8px] font-bold uppercase tracking-[0.18em] text-white/40">
        {title}
      </p>

      {children}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-2 py-2 text-left text-[10px] transition ${
        active
          ? "bg-orange-500/[0.08] text-orange-400"
          : "text-white/40 hover:bg-white/[0.03] hover:text-white/70"
      }`}
    >
      <span>{children}</span>

      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
      )}
    </button>
  );
}