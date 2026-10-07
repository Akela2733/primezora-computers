"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Package, ShoppingBag } from "lucide-react";

import { getOrderStatusLabel, type OrderStatus } from "@/lib/order-status";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryMethod: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

type OrderListResponse = {
  orders?: CustomerOrder[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  error?: string;
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  CONFIRMED: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  PROCESSING: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  SHIPPED: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  READY_FOR_PICKUP: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  CANCELLED: "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

export default function CustomerOrdersClient() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOrders() {
      try {
        const response = await fetch(
          `/api/customer/orders?page=${page}&pageSize=10`,
          { signal: controller.signal, cache: "no-store" }
        );
        const result = (await response.json()) as OrderListResponse;
        if (!response.ok) {
          throw new Error(result.error || "Unable to load your orders.");
        }
        setData(result);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your orders. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadOrders();
    return () => controller.abort();
  }, [page, reloadKey]);

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] py-10 text-white">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-white/70"
      >
        <ArrowLeft size={14} />
        Back to Account
      </Link>

      <header className="mb-8 mt-7">
        <p className="font-display text-[9px] uppercase tracking-[0.3em] text-amber-400">
          Customer Account
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase">My Orders</h1>
        <p className="mt-2 text-xs text-white/40">
          View your order history and track fulfillment status.
        </p>
      </header>

      <section className="rounded-2xl border border-white/[0.08] bg-[#080d13]">
        {isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading orders">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="p-10 text-center">
            <p className="text-sm text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setError("");
                setReloadKey((key) => key + 1);
              }}
              className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/70 hover:text-white"
            >
              Try again
            </button>
          </div>
        ) : data?.orders?.length ? (
          <div className="space-y-3 p-4 sm:p-6">
            {data.orders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-amber-500/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] pb-3">
                  <div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-mono text-xs font-semibold text-amber-400 hover:text-amber-300"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-1 text-[10px] text-white/35">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 font-display text-[9px] font-semibold uppercase tracking-wider ${STATUS_STYLES[order.status]}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-white/45">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"} ·{" "}
                    {order.deliveryMethod === "pickup" ? "Pickup" : "Delivery"}
                  </span>
                  <span className="font-display font-bold text-white">
                    LKR {order.total.toLocaleString("en-LK")}
                  </span>
                </div>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300 hover:text-amber-200"
                >
                  View order <ChevronRight size={13} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShoppingBag size={26} className="mx-auto text-white/20" />
            <h2 className="mt-4 font-display text-sm font-semibold uppercase text-white/70">
              No orders yet
            </h2>
            <p className="mt-2 text-xs text-white/35">
              Your purchases and their status will appear here.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
            >
              <Package size={13} /> Explore products
            </Link>
          </div>
        )}

        {!isLoading && !error && (data?.totalPages ?? 0) > 1 && (
          <nav
            aria-label="Order pages"
            className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setIsLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
              className="inline-flex items-center gap-1 text-xs text-white/55 disabled:opacity-25"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-[10px] text-white/35">
              Page {data?.page} of {data?.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() => {
                setIsLoading(true);
                setPage((current) => current + 1);
              }}
              className="inline-flex items-center gap-1 text-xs text-white/55 disabled:opacity-25"
            >
              Next <ChevronRight size={15} />
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
