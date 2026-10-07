import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Search,
} from "lucide-react";

import InventoryStockEditor from "./InventoryStockEditor";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const statuses = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In Stock" },
  { value: "low-stock", label: "Low Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
] as const;

type InventoryStatus = (typeof statuses)[number]["value"];

type InventoryProduct = {
  id: string;
  name: string;
  image: string;
  stockQuantity: number;
  inStock: boolean;
  price: number;
  updatedAt: string;
};

type InventoryMetrics = {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
}) {
  await requireAdminPage("/admin/inventory");
  const params = await searchParams;
  const searchQuery =
    typeof params.q === "string" ? params.q.trim() : "";
  const requestedStatus =
    typeof params.status === "string" ? params.status : "all";
  const status: InventoryStatus = statuses.some(
    (item) => item.value === requestedStatus
  )
    ? (requestedStatus as InventoryStatus)
    : "all";

  const statusWhere =
    status === "in-stock"
      ? { stockQuantity: { gt: 0 } }
      : status === "low-stock"
        ? {
            stockQuantity: {
              gt: 0,
              lte: LOW_STOCK_THRESHOLD,
            },
          }
        : status === "out-of-stock"
          ? { stockQuantity: 0 }
          : {};

  const where = {
    ...statusWhere,
    ...(searchQuery
      ? {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
            {
              slug: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
            {
              brand: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
            {
              id: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  let metrics: InventoryMetrics | null = null;
  let products: InventoryProduct[] = [];
  let loadError = "";

  try {
    const [total, inStock, lowStock, outOfStock, rows] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({
          where: { stockQuantity: { gt: 0 } },
        }),
        prisma.product.count({
          where: {
            stockQuantity: {
              gt: 0,
              lte: LOW_STOCK_THRESHOLD,
            },
          },
        }),
        prisma.product.count({
          where: { stockQuantity: 0 },
        }),
        prisma.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            image: true,
            stockQuantity: true,
            inStock: true,
            price: true,
            updatedAt: true,
          },
          orderBy: [
            { stockQuantity: "asc" },
            { name: "asc" },
          ],
        }),
      ]);

    metrics = { total, inStock, lowStock, outOfStock };
    products = rows.map((product) => ({
      ...product,
      updatedAt: product.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("ADMIN INVENTORY LOAD ERROR:", error);
    loadError = "Unable to load inventory. Please try again.";
  }

  const filterHref = (nextStatus: InventoryStatus) => {
    const nextParams = new URLSearchParams();
    if (searchQuery) nextParams.set("q", searchQuery);
    if (nextStatus !== "all") nextParams.set("status", nextStatus);
    const query = nextParams.toString();
    return `/admin/inventory${query ? `?${query}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            Admin Dashboard
          </Link>

          <div className="mt-7">
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-orange-400">
              Store Management
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase">
              Inventory
            </h1>
            <p className="mt-2 text-sm text-white/35">
              Review and update stock quantities from PostgreSQL.
            </p>
          </div>
        </div>
      </section>

      {metrics && (
        <section className="container-primezora pt-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total Products" value={metrics.total} tone="neutral" />
            <Metric label="Products in Stock" value={metrics.inStock} tone="green" />
            <Metric label={`Low Stock (1-${LOW_STOCK_THRESHOLD})`} value={metrics.lowStock} tone="amber" />
            <Metric label="Out of Stock" value={metrics.outOfStock} tone="red" />
          </div>
        </section>
      )}

      <section className="container-primezora py-8">
        <div className="overflow-hidden border border-white/[0.07] bg-[#080d13]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
            <form
              action="/admin/inventory"
              method="get"
              className="flex h-11 w-full max-w-md items-center gap-3 border border-white/[0.07] bg-black/20 px-4"
            >
              {status !== "all" && (
                <input type="hidden" name="status" value={status} />
              )}
              <Search size={15} className="shrink-0 text-white/25" />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                aria-label="Search inventory"
                placeholder="Search product, brand, slug or ID..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
              />
              <button
                type="submit"
                className="text-[8px] font-bold uppercase tracking-[0.12em] text-orange-400"
              >
                Search
              </button>
            </form>

            <nav
              aria-label="Inventory filters"
              className="flex flex-wrap gap-1 border border-white/[0.07] p-1"
            >
              {statuses.map((item) => (
                <Link
                  key={item.value}
                  href={filterHref(item.value)}
                  aria-current={status === item.value ? "page" : undefined}
                  className={`px-3 py-2 text-[8px] font-bold uppercase tracking-[0.12em] transition ${
                    status === item.value
                      ? "bg-orange-500 text-black"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {loadError ? (
            <div role="alert" className="p-12 text-center text-sm text-red-300">
              {loadError}
            </div>
          ) : products.length === 0 ? (
            <div className="p-14 text-center">
              <Package size={30} className="mx-auto text-white/20" />
              <p className="mt-4 font-display text-sm font-bold uppercase text-white/70">
                No inventory found
              </p>
              <p className="mt-2 text-xs text-white/35">
                {searchQuery || status !== "all"
                  ? "Try changing the search or stock filter."
                  : "Products will appear here after they are added."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <Heading>Product</Heading>
                    <Heading>ID</Heading>
                    <Heading>Current Stock</Heading>
                    <Heading>Status</Heading>
                    <Heading>Price</Heading>
                    <Heading>Actions</Heading>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-white/[0.05] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/[0.07] bg-black/20">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-xs truncate text-xs font-semibold text-white/75">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[9px] text-white/35">
                        {product.id.slice(0, 10).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-white/75">
                        {product.stockQuantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StockStatus
                          stockQuantity={product.stockQuantity}
                          inStock={product.inStock}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-orange-400">
                        LKR {product.price.toLocaleString("en-LK")}
                      </td>
                      <td className="px-4 py-3">
                        <InventoryStockEditor
                          key={`${product.id}-${product.updatedAt}`}
                          productId={product.id}
                          stockQuantity={product.stockQuantity}
                          updatedAt={product.updatedAt}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "green" | "amber" | "red";
}) {
  const valueClass = {
    neutral: "text-white",
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  }[tone];

  return (
    <div className="border border-white/[0.07] bg-[#080d13] p-4">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className={`mt-4 font-display text-2xl font-bold ${valueClass}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30">
      {children}
    </th>
  );
}

function StockStatus({
  stockQuantity,
  inStock,
}: {
  stockQuantity: number;
  inStock: boolean;
}) {
  const label =
    stockQuantity === 0
      ? "Out of Stock"
      : !inStock
        ? "Disabled"
        : stockQuantity <= LOW_STOCK_THRESHOLD
          ? "Low Stock"
          : "In Stock";
  const tone =
    stockQuantity === 0
      ? "border-red-500/20 bg-red-500/[0.05] text-red-300"
      : !inStock
        ? "border-white/10 bg-white/[0.03] text-white/45"
        : stockQuantity <= LOW_STOCK_THRESHOLD
          ? "border-amber-500/20 bg-amber-500/[0.05] text-amber-300"
          : "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300";

  return (
    <span className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] ${tone}`}>
      {label}
    </span>
  );
}