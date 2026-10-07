"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { products } from "@/data/products";
import {
  filterProducts,
  type ProductFilters,
} from "@/lib/products";

import {
  ShopFilters,
  type ShopFilterState,
} from "@/components/shop/ShopFilters";

import { ProductCard } from "@/components/shop/ProductCard";

const PRODUCTS_PER_PAGE = 9;

export default function ShopPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ShopFilterState = {
    search: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "",
    brand: searchParams.get("brand") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    inStock: searchParams.get("stock") === "true",
    sort:
      (searchParams.get("sort") as ShopFilterState["sort"]) ??
      "featured",
  };

  const currentPage = Math.max(
    1,
    Number(searchParams.get("page") ?? "1")
  );

  const buildURL = (
    nextFilters: ShopFilterState,
    page = 1
  ) => {
    const params = new URLSearchParams();

    if (nextFilters.search.trim()) {
      params.set(
        "search",
        nextFilters.search.trim()
      );
    }

    if (nextFilters.category) {
      params.set(
        "category",
        nextFilters.category
      );
    }

    if (nextFilters.brand) {
      params.set(
        "brand",
        nextFilters.brand
      );
    }

    if (nextFilters.minPrice) {
      params.set(
        "minPrice",
        nextFilters.minPrice
      );
    }

    if (nextFilters.maxPrice) {
      params.set(
        "maxPrice",
        nextFilters.maxPrice
      );
    }

    if (nextFilters.inStock) {
      params.set("stock", "true");
    }

    if (nextFilters.sort !== "featured") {
      params.set(
        "sort",
        nextFilters.sort
      );
    }

    if (page > 1) {
      params.set(
        "page",
        String(page)
      );
    }

    const queryString =
      params.toString();

    return queryString
      ? `${pathname}?${queryString}`
      : pathname;
  };

  const handleFilterChange = (
    nextFilters: ShopFilterState
  ) => {
    window.history.replaceState(
      null,
      "",
      buildURL(nextFilters, 1)
    );
  };

  const filteredProducts = useMemo(() => {
    return filterProducts(
      products,
      {
        search: filters.search,
        category: filters.category || "All",
        brand: filters.brand || "All",
        minPrice: filters.minPrice
          ? Number(filters.minPrice)
          : 0,
        maxPrice: filters.maxPrice
          ? Number(filters.maxPrice)
          : 500000,
        inStockOnly: filters.inStock,
        sort: filters.sort,
      } satisfies ProductFilters
    );
  }, [
    filters.search,
    filters.category,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.sort,
  ]);

  const totalProducts =
    filteredProducts.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalProducts /
        PRODUCTS_PER_PAGE
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) *
    PRODUCTS_PER_PAGE;

  const visibleProducts =
    filteredProducts.slice(
      startIndex,
      startIndex +
        PRODUCTS_PER_PAGE
    );

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)]">
        {/* FILTERS */}

        <aside>
          <ShopFilters
            products={products}
            filters={filters}
            onChange={
              handleFilterChange
            }
            resultCount={
              totalProducts
            }
          />
        </aside>

        {/* PRODUCTS */}

        <div>
          {/* Top bar */}

          <div className="mb-6 flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/25">
                Products
              </p>

              <p className="mt-1 text-[10px] text-white/50">
                Showing{" "}
                {totalProducts === 0
                  ? 0
                  : startIndex + 1}
                –
                {Math.min(
                  startIndex +
                    PRODUCTS_PER_PAGE,
                  totalProducts
                )}{" "}
                of{" "}
                {totalProducts}
              </p>
            </div>

            {totalProducts > 0 && (
              <span className="hidden text-[8px] uppercase tracking-[0.14em] text-orange-400/70 sm:block">
                Page {safePage} /{" "}
                {totalPages}
              </span>
            )}
          </div>

          {/* Product grid */}

          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {visibleProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyState
              onClear={() =>
                handleFilterChange(
                  {
                    search: "",
                    category: "",
                    brand: "",
                    minPrice: "",
                    maxPrice: "",
                    inStock: false,
                    sort: "featured",
                  }
                )
              }
            />
          )}

          {/* Pagination */}

          {totalPages > 1 && (
            <Pagination
              currentPage={
                safePage
              }
              totalPages={
                totalPages
              }
              onPageChange={(
                page
              ) =>
                router.push(
                  buildURL(filters, page),
                  {
                    scroll: false,
                  }
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGINATION
============================================================ */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (
    page: number
  ) => void;
}) {
  const pages: number[] = [];

  const start = Math.max(
    1,
    currentPage - 2
  );

  const end = Math.min(
    totalPages,
    currentPage + 2
  );

  for (
    let page = start;
    page <= end;
    page++
  ) {
    pages.push(page);
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-1">
      {/* Previous */}

      <button
        type="button"
        disabled={
          currentPage === 1
        }
        onClick={() =>
          onPageChange(
            currentPage - 1
          )
        }
        className="flex h-9 min-w-9 items-center justify-center border border-white/10 px-3 text-[8px] uppercase tracking-[0.1em] text-white/40 transition hover:border-orange-500/30 hover:text-orange-400 disabled:pointer-events-none disabled:opacity-20"
      >
        Prev
      </button>

      {/* First page */}

      {start > 1 && (
        <>
          <PageButton
            page={1}
            active={
              currentPage === 1
            }
            onClick={
              onPageChange
            }
          />

          {start > 2 && (
            <span className="px-1 text-white/20">
              ...
            </span>
          )}
        </>
      )}

      {/* Pages */}

      {pages.map((page) => (
        <PageButton
          key={page}
          page={page}
          active={
            page === currentPage
          }
          onClick={
            onPageChange
          }
        />
      ))}

      {/* Last page */}

      {end < totalPages && (
        <>
          {end <
            totalPages - 1 && (
            <span className="px-1 text-white/20">
              ...
            </span>
          )}

          <PageButton
            page={totalPages}
            active={
              currentPage ===
              totalPages
            }
            onClick={
              onPageChange
            }
          />
        </>
      )}

      {/* Next */}

      <button
        type="button"
        disabled={
          currentPage ===
          totalPages
        }
        onClick={() =>
          onPageChange(
            currentPage + 1
          )
        }
        className="flex h-9 min-w-9 items-center justify-center border border-white/10 px-3 text-[8px] uppercase tracking-[0.1em] text-white/40 transition hover:border-orange-500/30 hover:text-orange-400 disabled:pointer-events-none disabled:opacity-20"
      >
        Next
      </button>
    </div>
  );
}

function PageButton({
  page,
  active,
  onClick,
}: {
  page: number;
  active: boolean;
  onClick: (
    page: number
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onClick(page)
      }
      className={`flex h-9 w-9 items-center justify-center border text-[9px] font-bold transition ${
        active
          ? "border-orange-500 bg-orange-500 text-black"
          : "border-white/10 text-white/40 hover:border-orange-500/30 hover:text-orange-400"
      }`}
    >
      {page}
    </button>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center border border-white/[0.07] bg-white/[0.015] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center border border-white/10 text-orange-400/50">
        <span className="text-lg">
          0
        </span>
      </div>

      <h2 className="mt-5 text-xl font-bold">
        No products found
      </h2>

      <p className="mt-2 max-w-sm text-[10px] leading-5 text-white/30">
        Try changing your search,
        category, brand or price
        filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-6 h-10 bg-orange-500 px-5 text-[8px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
      >
        Clear Filters
      </button>
    </div>
  );
}