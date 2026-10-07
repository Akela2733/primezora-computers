"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Package, ReceiptText, UserRound } from "lucide-react";

import { getOrderStatusLabel, type OrderStatus } from "@/lib/order-status";

type CustomerOrderDetail = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryMethod: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: {
    id: string;
    productName: string;
    productImage: string;
    productPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  statusHistory: {
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    createdAt: string;
  }[];
};

type OrderResponse = {
  order?: CustomerOrderDetail;
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

export default function CustomerOrderDetailClient({
  orderId,
}: {
  orderId: string;
}) {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrder() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/customer/orders/${encodeURIComponent(orderId)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const result = (await response.json()) as OrderResponse;
        if (!response.ok) {
          throw new Error(result.error || "Unable to load this order.");
        }
        if (!result.order) {
          throw new Error("Order details were not returned.");
        }
        setOrder(result.order);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this order. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadOrder();
    return () => controller.abort();
  }, [orderId, reloadKey]);

  return (
    <main className="container-primezora min-h-[calc(100vh-76px)] py-10 text-white">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-white/70"
      >
        <ArrowLeft size={14} />
        Back to Orders
      </Link>

      {isLoading ? (
        <div className="mt-8 space-y-4" aria-label="Loading order">
          <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      ) : error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-rose-500/20 bg-[#080d13] p-10 text-center">
          <p className="text-sm text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/70 hover:text-white"
          >
            Try again
          </button>
        </div>
      ) : order ? (
        <>
          <header className="mt-7 rounded-2xl border border-white/[0.08] bg-[#080d13] p-6">
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-amber-400">
              Order Details
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <h1 className="break-all font-mono text-xl font-bold text-white sm:text-2xl">
                {order.orderNumber}
              </h1>
              <span className={`rounded-full border px-3 py-1.5 font-display text-[9px] font-semibold uppercase tracking-wider ${STATUS_STYLES[order.status]}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <p className="mt-3 text-[10px] text-white/40">
              Placed {new Date(order.createdAt).toLocaleString("en-LK")}
              {" · "}Updated {new Date(order.updatedAt).toLocaleString("en-LK")}
            </p>
          </header>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-5">
                <SectionTitle icon={<Package size={15} />} title="Products" />
                <div className="mt-4 divide-y divide-white/[0.05]">
                  {order.items.map((item) => (
                    <article key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <Image
                        src={item.productImage}
                        alt=""
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 shrink-0 rounded-lg border border-white/[0.07] bg-black/20 object-contain p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-white/85">{item.productName}</h2>
                        <p className="mt-1 text-[10px] text-white/40">
                          LKR {item.productPrice.toLocaleString("en-LK")} × {item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-semibold text-white/75">
                        LKR {item.lineTotal.toLocaleString("en-LK")}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-5">
                <SectionTitle icon={<UserRound size={15} />} title="Customer" />
                <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
                  <Detail label="Name" value={order.customerName} />
                  <Detail label="Email" value={order.customerEmail} />
                  <Detail label="Phone" value={order.customerPhone || "—"} />
                </dl>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-5">
                <SectionTitle icon={<MapPin size={15} />} title="Delivery & Payment" />
                <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
                  <Detail
                    label="Delivery method"
                    value={order.deliveryMethod === "pickup" ? "Store pickup" : "Delivery"}
                  />
                  <Detail
                    label="Address"
                    value={
                      order.deliveryMethod === "pickup"
                        ? "Customer will collect the order."
                        : [order.address, order.city, order.province, order.postalCode]
                            .filter(Boolean)
                            .join(", ") || "Address not provided"
                    }
                  />
                  <Detail
                    label="Payment method"
                    value={order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}
                  />
                </dl>
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-[#080d13] p-5">
                <SectionTitle icon={<ReceiptText size={15} />} title="Order Timeline" />
                {order.statusHistory.length ? (
                  <ol className="mt-4 space-y-4">
                    {order.statusHistory.map((entry, index) => (
                      <li key={`${entry.createdAt}-${index}`} className="flex gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-4 gap-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75">
                            {getOrderStatusLabel(entry.fromStatus)}{" "}
                            <span className="text-amber-300">→</span>{" "}
                            {getOrderStatusLabel(entry.toStatus)}
                          </p>
                          <time className="text-[9px] text-white/35">
                            {new Date(entry.createdAt).toLocaleString("en-LK")}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 text-xs text-white/40">
                    No status updates have been recorded yet.
                  </p>
                )}
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#080d13] p-5 lg:sticky lg:top-24">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                Order Summary
              </h2>
              <div className="mt-5 space-y-4">
                <SummaryRow label="Subtotal" value={order.subtotal} />
                <SummaryRow label="Delivery Fee" value={order.deliveryFee} />
                <div className="border-t border-white/[0.07] pt-4">
                  <SummaryRow label="Total" value={order.total} emphasized />
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </main>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
      <span className="text-amber-400">{icon}</span>
      {title}
    </h2>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</dt>
      <dd className="mt-1 break-words leading-5 text-white/75">{value}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] text-white/40">{label}</span>
      <span className={`text-xs font-bold ${emphasized ? "text-amber-400" : "text-white/75"}`}>
        LKR {value.toLocaleString("en-LK")}
      </span>
    </div>
  );
}
