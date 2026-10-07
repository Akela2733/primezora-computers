import Link from "next/link";
import ProductActions from "./ProductActions";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
  Star,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  created: "Product created successfully.",
  updated: "Product updated successfully.",
  enabled: "Product enabled successfully.",
  disabled: "Product disabled successfully.",
  deleted: "Product permanently deleted.",
};

type AdminProductsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    notice?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdminPage("/admin/products");
  const params = await searchParams;
  const searchQuery =
    typeof params.q === "string"
      ? params.q.trim()
      : "";
  const requestedPage = Math.max(parseInteger(params.page, 1), 1);
  const limit = Math.min(
    Math.max(parseInteger(params.limit, DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE
  );
  const notice =
    typeof params.notice === "string"
      ? notices[params.notice]
      : undefined;

  const where = searchQuery
    ? {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" as const } },
          { slug: { contains: searchQuery, mode: "insensitive" as const } },
          { brand: { contains: searchQuery, mode: "insensitive" as const } },
          {
            category: {
              contains: searchQuery,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let loadError = "";
  let pagination = {
    page: requestedPage,
    limit,
    total: 0,
    totalPages: 0,
  };

  try {
    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);
    const page = Math.min(requestedPage, Math.max(totalPages, 1));

    products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    pagination = { page, limit, total, totalPages };
  } catch (error) {
    console.error("ADMIN PRODUCTS LOAD ERROR:", error);
    loadError = "Failed to load products.";
  }

  return (
    <main className="min-h-screen bg-[#05090f] text-white">

      {/* Header */}

      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Admin Dashboard
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>
              <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
                Store Management
              </p>

              <h1 className="mt-3 font-display text-3xl font-bold uppercase">
                Products
              </h1>

              <p className="mt-2 text-sm text-white/35">
                {pagination.total} {searchQuery ? "matching" : "total"} products.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex h-12 items-center justify-center gap-2 bg-orange-500 px-6 text-[9px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
            >
              <Plus size={15} />
              Add Product
            </Link>

          </div>

        </div>
      </section>

      {(notice || loadError) && (
        <section className="container-primezora pt-6">
          {notice && (
            <p
              role="status"
              className="border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-300"
            >
              {notice}
            </p>
          )}
          {loadError && (
            <p
              role="alert"
              className="border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-xs text-red-300"
            >
              {loadError}
            </p>
          )}
        </section>
      )}

      {/* Products */}

      <section className="container-primezora py-10">

        <div className="overflow-hidden border border-white/[0.07] bg-[#080d13]">

          {/* Toolbar */}

          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 md:flex-row md:items-center md:justify-between">

            <form
              method="get"
              action="/admin/products"
              className="flex h-11 max-w-md flex-1 items-center gap-3 border border-white/[0.07] bg-black/20 px-4"
            >
              <Search
                size={15}
                className="text-white/25"
              />

              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Search products..."
                aria-label="Search products"
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20"
              />

              <button
                type="submit"
                className="text-[8px] font-bold uppercase tracking-[0.12em] text-orange-400"
              >
                Search
              </button>
            </form>

            <div className="text-[9px] uppercase tracking-[0.15em] text-white/30">
              {pagination.total} Products
            </div>

          </div>

          {/* Desktop table */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full">

              <thead>
                <tr className="border-b border-white/[0.06] text-left">

                  <th className="px-5 py-4 text-[9px] uppercase tracking-[0.15em] text-white/25">
                    Product
                  </th>

                  <th className="px-5 py-4 text-[9px] uppercase tracking-[0.15em] text-white/25">
                    Category
                  </th>

                  <th className="px-5 py-4 text-[9px] uppercase tracking-[0.15em] text-white/25">
                    Price
                  </th>

                  <th className="px-5 py-4 text-[9px] uppercase tracking-[0.15em] text-white/25">
                    Stock
                  </th>

                  <th className="px-5 py-4 text-[9px] uppercase tracking-[0.15em] text-white/25">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-[9px] uppercase tracking-[0.15em] text-white/25">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-white/[0.05] transition hover:bg-white/[0.015]"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-white/[0.07] bg-black/20">

                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-2"
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="max-w-xs truncate text-xs font-semibold text-white/75">
                            {product.name}
                          </p>

                          <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-white/25">
                            {product.brand}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-4 text-xs text-white/40">
                      {product.category}
                    </td>

                    <td className="px-5 py-4">

                      <p className="text-xs font-bold text-orange-400">
                        LKR{" "}
                        {product.price.toLocaleString(
                          "en-LK"
                        )}
                      </p>

                      {product.oldPrice && (
                        <p className="mt-1 text-[9px] text-white/20 line-through">
                          LKR{" "}
                          {product.oldPrice.toLocaleString(
                            "en-LK"
                          )}
                        </p>
                      )}

                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={
                          product.stockQuantity <= 5
                            ? "text-xs font-bold text-red-400"
                            : "text-xs text-white/50"
                        }
                      >
                        {product.stockQuantity}
                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            product.inStock && product.stockQuantity > 0
                              ? "bg-emerald-400"
                              : product.inStock
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          }`}
                        />

                        <span className="text-[9px] uppercase tracking-[0.1em] text-white/40">
                          {!product.inStock
                            ? "Disabled"
                            : product.stockQuantity > 0
                              ? "Enabled"
                              : "Out of Stock"}
                        </span>

                      </div>

                    </td>

                    <td className="px-5 py-4 text-right">
                      <ProductActions
                        productId={product.id}
                        productName={product.name}
                        inStock={product.inStock}
                      />
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* Mobile cards */}

          <div className="divide-y divide-white/[0.05] md:hidden">

            {products.map((product) => (
              <div
                key={product.id}
                className="p-5"
              >

                <div className="flex gap-4">

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-white/[0.07] bg-black/20">

                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain p-2"
                    />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-xs font-semibold text-white/75">
                      {product.name}
                    </p>

                    <p className="mt-1 text-[9px] uppercase text-white/25">
                      {product.brand}
                    </p>

                    <p className="mt-3 text-xs font-bold text-orange-400">
                      LKR{" "}
                      {product.price.toLocaleString(
                        "en-LK"
                      )}
                    </p>

                  </div>

                  <ProductActions
                    productId={product.id}
                    productName={product.name}
                    inStock={product.inStock}
                  />

                </div>

                <div className="mt-5 flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <Package
                      size={13}
                      className="text-white/25"
                    />

                    <span className="text-[9px] uppercase tracking-[0.1em] text-white/35">
                      Stock: {product.stockQuantity}
                    </span>
                  </div>

                  {product.featured && (
                    <div className="flex items-center gap-1 text-[9px] uppercase text-orange-400">
                      <Star size={11} />
                      Featured
                    </div>
                  )}

                </div>

              </div>
            ))}

          </div>

          {products.length === 0 && (
            <div className="p-16 text-center">

              <Package
                size={32}
                className="mx-auto text-white/15"
              />

              <p className="mt-5 font-display text-sm uppercase">
                No Products
              </p>

              <p className="mt-2 text-xs text-white/30">
                Add your first product to the catalog.
              </p>

            </div>
          )}

          {!loadError && pagination.total > 0 && (
            <nav
              aria-label="Product pages"
              className="flex items-center justify-between border-t border-white/[0.06] px-4 py-4"
            >
              <form action="/admin/products" method="get">
                {searchQuery && (
                  <input type="hidden" name="q" value={searchQuery} />
                )}
                <input
                  type="hidden"
                  name="limit"
                  value={pagination.limit}
                />
                <input
                  type="hidden"
                  name="page"
                  value={Math.max(1, pagination.page - 1)}
                />
                <button
                  type="submit"
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55 transition enabled:hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
              </form>
              <span className="text-[9px] text-white/35">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <form action="/admin/products" method="get">
                {searchQuery && (
                  <input type="hidden" name="q" value={searchQuery} />
                )}
                <input
                  type="hidden"
                  name="limit"
                  value={pagination.limit}
                />
                <input
                  type="hidden"
                  name="page"
                  value={Math.min(
                    pagination.totalPages,
                    pagination.page + 1
                  )}
                />
                <button
                  type="submit"
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/55 transition enabled:hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
                >
                  Next <ChevronRight size={14} />
                </button>
              </form>
            </nav>
          )}

        </div>

      </section>

    </main>
  );
}

function parseInteger(
  values: string | string[] | undefined,
  fallback: number
): number {
  const value = Array.isArray(values) ? values[0] : values;
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}