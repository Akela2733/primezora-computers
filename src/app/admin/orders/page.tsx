import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, ShoppingBag } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  isOrderStatus,
  ORDER_STATUS_OPTIONS,
  type OrderStatus,
} from "@/lib/order-status";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const PAGE_SIZES = [20, 50, 100] as const;
const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
] as const;

type AdminOrdersPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    search?: string | string[];
    q?: string | string[];
    status?: string | string[];
    paymentMethod?: string | string[];
    dateRange?: string | string[];
  }>;
};

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function parsePositiveInteger(value: string, fallback: number): number {
  if (!/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getCreatedAtFilter(filter: string) {
  const now = new Date();
  if (filter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (filter === "last7days") {
    return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (filter === "last30days") {
    return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }
  return undefined;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  await requireAdminPage("/admin/orders");
  const params = await searchParams;
  const query = single(params.search) || single(params.q).trim();
  const page = parsePositiveInteger(single(params.page), 1);
  const requestedPageSize = parsePositiveInteger(single(params.pageSize), 20);
  const pageSize = PAGE_SIZES.includes(
    requestedPageSize as (typeof PAGE_SIZES)[number]
  )
    ? requestedPageSize
    : 20;
  const rawStatus = single(params.status);
  const selectedStatus: OrderStatus | null = isOrderStatus(rawStatus)
    ? rawStatus
    : null;
  const rawPayment = single(params.paymentMethod);
  const selectedPayment =
    rawPayment === "cod" || rawPayment === "bank" ? rawPayment : "";
  const rawDateRange = single(params.dateRange);
  const selectedDateRange = DATE_FILTERS.some(
    (option) => option.value === rawDateRange
  )
    ? rawDateRange
    : "all";
  const safeQuery = query.trim().slice(0, 100);

  const createdAt = getCreatedAtFilter(selectedDateRange);
  const where = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedPayment ? { paymentMethod: selectedPayment } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(safeQuery
      ? {
          OR: [
            { orderNumber: { contains: safeQuery, mode: "insensitive" as const } },
            { customerName: { contains: safeQuery, mode: "insensitive" as const } },
            { customerEmail: { contains: safeQuery, mode: "insensitive" as const } },
            { customerPhone: { contains: safeQuery, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  let orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    createdAt: Date;
    total: number;
    paymentMethod: string;
    status: OrderStatus;
    itemCount: number;
  }[] = [];
  let total = 0;
  let loadError = "";

  try {
    const [rows, count] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          createdAt: true,
          total: true,
          paymentMethod: true,
          status: true,
          items: { select: { quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    orders = rows.map(({ items, ...order }) => ({
      ...order,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }));
    total = count;
  } catch (error) {
    console.error("ADMIN ORDERS LOAD ERROR:", error);
    loadError = "Unable to load orders. Please try again.";
  }

  const totalPages = Math.ceil(total / pageSize);
  const pageHref = (targetPage: number) => {
    const nextParams = new URLSearchParams();
    if (safeQuery) nextParams.set("search", safeQuery);
    if (selectedStatus) nextParams.set("status", selectedStatus);
    if (selectedPayment) nextParams.set("paymentMethod", selectedPayment);
    if (selectedDateRange !== "all") nextParams.set("dateRange", selectedDateRange);
    nextParams.set("pageSize", String(pageSize));
    nextParams.set("page", String(targetPage));
    return `/admin/orders?${nextParams.toString()}`;
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
              Orders
            </h1>
            <p className="mt-2 text-sm text-white/35">
              Manage customer orders, payments and fulfillment.
            </p>
          </div>
        </div>
      </section>

      <section className="container-primezora py-8">
        <div className="overflow-hidden border border-white/[0.07] bg-[#080d13]">
          <form
            action="/admin/orders"
            method="get"
            className="grid gap-3 border-b border-white/[0.06] p-4 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_190px_190px_170px_110px_auto]"
          >
            <label className="flex h-11 items-center gap-3 border border-white/[0.07] bg-black/20 px-4 sm:col-span-2 xl:col-span-1">
              <Search size={15} className="shrink-0 text-white/25" />
              <input
                type="search"
                name="search"
                defaultValue={safeQuery}
                maxLength={100}
                placeholder="Order, customer, email or phone..."
                aria-label="Search orders"
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
              />
            </label>
            <select
              name="status"
              defaultValue={selectedStatus ?? ""}
              aria-label="Filter by status"
              className="h-11 border border-white/[0.07] bg-[#080d13] px-3 text-xs text-white/70"
            >
              <option value="">All statuses</option>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              name="paymentMethod"
              defaultValue={selectedPayment}
              aria-label="Filter by payment method"
              className="h-11 border border-white/[0.07] bg-[#080d13] px-3 text-xs text-white/70"
            >
              <option value="">All payment methods</option>
              <option value="cod">Cash on Delivery</option>
              <option value="bank">Bank Transfer</option>
            </select>
            <select
              name="dateRange"
              defaultValue={selectedDateRange}
              aria-label="Filter by date"
              className="h-11 border border-white/[0.07] bg-[#080d13] px-3 text-xs text-white/70"
            >
              {DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              aria-label="Orders per page"
              className="h-11 border border-white/[0.07] bg-[#080d13] px-3 text-xs text-white/70"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
            <button
              type="submit"
              className="h-11 bg-orange-500 px-5 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-orange-400"
            >
              Apply
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <p className="text-[10px] text-white/40">
              {total.toLocaleString()} matching orders
              {total > 0 ? ` · Page ${page} of ${totalPages}` : ""}
            </p>
            {safeQuery && (
              <p className="text-[10px] text-orange-300/70">
                Search: <span className="font-semibold">{safeQuery}</span>
              </p>
            )}
          </div>

          {loadError ? (
            <div role="alert" className="p-12 text-center text-sm text-red-300">
              {loadError}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-14 text-center">
              <ShoppingBag size={30} className="mx-auto text-white/20" />
              <p className="mt-4 font-display text-sm font-bold uppercase text-white/70">
                {safeQuery || selectedStatus || selectedPayment || selectedDateRange !== "all"
                  ? "No matching orders"
                  : "No orders yet"}
              </p>
              <p className="mt-2 text-xs text-white/35">
                {safeQuery || selectedStatus || selectedPayment || selectedDateRange !== "all"
                  ? "Try changing or clearing your filters."
                  : "Orders will appear here after customers check out."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <Heading>Order Number</Heading>
                    <Heading>Customer</Heading>
                    <Heading>Date</Heading>
                    <Heading>Items</Heading>
                    <Heading>Total</Heading>
                    <Heading>Payment</Heading>
                    <Heading>Status</Heading>
                    <Heading>Actions</Heading>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.015]"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-[10px] font-bold text-orange-300 transition hover:text-orange-200"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-white/75">{order.customerName}</p>
                        <p className="mt-1 text-[9px] text-white/35">
                          {order.customerEmail || order.customerPhone || "—"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[10px] text-white/45">
                        {order.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4 text-xs text-white/55">{order.itemCount}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-white/75">
                        LKR {order.total.toLocaleString("en-LK")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[9px] text-white/45">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-[0.1em]">
                          <Link href={`/admin/orders/${order.id}`} className="text-white/65 hover:text-white">
                            View
                          </Link>
                          <Link href={`/admin/orders/${order.id}#status-controls`} className="text-orange-300 hover:text-orange-200">
                            Update Status
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loadError && total > 0 && (
            <nav
              aria-label="Order pages"
              className="flex items-center justify-between border-t border-white/[0.06] px-4 py-4"
            >
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] ${page <= 1 ? "pointer-events-none text-white/20" : "text-white/55 hover:text-white"}`}
              >
                <ChevronLeft size={14} /> Previous
              </Link>
              <span className="text-[9px] text-white/35">Page {page} of {totalPages}</span>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] ${page >= totalPages ? "pointer-events-none text-white/20" : "text-white/55 hover:text-white"}`}
              >
                Next <ChevronRight size={14} />
              </Link>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[8px] font-bold uppercase tracking-[0.15em] text-white/30">
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const option = ORDER_STATUS_OPTIONS.find((item) => item.value === status);
  const color =
    status === "COMPLETED"
      ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
      : status === "CANCELLED"
        ? "border-red-500/20 bg-red-500/[0.05] text-red-300"
        : status === "PENDING"
          ? "border-amber-500/20 bg-amber-500/[0.05] text-amber-300"
          : "border-blue-500/20 bg-blue-500/[0.05] text-blue-300";

  return (
    <span className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] ${color}`}>
      {option?.label ?? status}
    </span>
  );
}
