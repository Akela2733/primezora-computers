"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Search } from "lucide-react";

type TrackedOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveryMethod: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: {
    id: string;
    productName: string;
    productPrice: number;
    quantity: number;
  }[];
  statusHistory: {
    fromStatus: string;
    toStatus: string;
    createdAt: string;
  }[];
};

const progressSteps = [
  { status: "PENDING", title: "Order Placed" },
  { status: "CONFIRMED", title: "Order Confirmed" },
  { status: "PROCESSING", title: "Processing" },
  { status: "SHIPPED", title: "Shipped" },
  { status: "COMPLETED", title: "Completed" },
];

const progressIndex: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  READY_FOR_PICKUP: 3,
  COMPLETED: 4,
};

function formatStatus(status: string): string {
  if (status === "READY_FOR_PICKUP") return "Ready for pickup";
  return status.toLowerCase().replaceAll("_", " ");
}

function formatMoney(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK")}`;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = (await response.json()) as {
        order?: TrackedOrder;
        error?: string;
      };

      if (!response.ok || !data.order) {
        setError(data.error ?? "Unable to find this order.");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Order tracking is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order
    ? progressIndex[order.status] ?? -1
    : -1;
  const cancelled = order?.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.07]">
        <div className="container-primezora py-14 text-center sm:py-20">
          <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-orange-400">
            Primezora Technologies
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
            Track Your Order
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-xs leading-6 text-white/45 sm:text-sm">
            Enter your order number and the email address used at checkout.
          </p>
        </div>
      </section>

      <section className="container-primezora py-10 sm:py-14">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl border border-white/[0.08] bg-[#080d13] p-4 sm:p-6"
        >
          <label
            htmlFor="order-number"
            className="mb-2 block text-[8px] font-bold uppercase tracking-[0.2em] text-white/45"
          >
            Order Number
          </label>
          <input
            id="order-number"
            type="text"
            autoComplete="off"
            required
            maxLength={64}
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="e.g. PRZ-..."
            className="h-12 w-full border border-white/[0.08] bg-black/30 px-4 text-xs uppercase tracking-[0.08em] text-white outline-none placeholder:text-white/25 focus:border-orange-500/40"
          />

          <label
            htmlFor="checkout-email"
            className="mb-2 mt-5 block text-[8px] font-bold uppercase tracking-[0.2em] text-white/45"
          >
            Checkout Email
          </label>
          <input
            id="checkout-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full border border-white/[0.08] bg-black/30 px-4 text-xs text-white outline-none placeholder:text-white/25 focus:border-orange-500/40"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 bg-orange-500 px-7 text-[9px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            <Search size={14} />
            {loading ? "Looking up order..." : "Track Order"}
            {!loading && <ChevronRight size={14} />}
          </button>

          {error && (
            <p role="alert" className="mt-4 text-xs text-red-300">
              {error}
            </p>
          )}
        </form>
      </section>

      {order && (
        <section className="container-primezora pb-20">
          <div className="mx-auto max-w-4xl border border-white/[0.08] bg-[#080d13]">
            <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-orange-400">
                  Order Details
                </p>
                <h2 className="mt-2 font-display text-xl font-bold tracking-wide sm:text-2xl">
                  #{order.orderNumber}
                </h2>
                <p className="mt-2 text-[9px] text-white/40">
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-LK", {
                    dateStyle: "long",
                  })}
                </p>
              </div>
              <span className="w-fit border border-orange-500/20 bg-orange-500/[0.05] px-3 py-2 text-[8px] font-bold uppercase tracking-[0.15em] text-orange-400">
                {formatStatus(order.status)}
              </span>
            </div>

            <div className="p-5 sm:p-8">
              <h3 className="mb-6 text-lg font-bold">Order Progress</h3>
              {cancelled ? (
                <p className="border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
                  This order has been cancelled.
                </p>
              ) : (
                <ol className="grid gap-3 sm:grid-cols-5">
                  {progressSteps.map((step, index) => {
                    const completed = index <= currentStep;
                    const current = index === currentStep;

                    return (
                      <li
                        key={step.status}
                        className={`border p-4 ${
                          current
                            ? "border-orange-500/40 bg-orange-500/[0.06]"
                            : completed
                              ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                              : "border-white/[0.07] bg-black/10"
                        }`}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10">
                          {completed ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                          )}
                        </span>
                        <p className="mt-3 text-[9px] font-bold uppercase tracking-wide text-white/75">
                          {step.title}
                        </p>
                        {current && (
                          <p className="mt-1 text-[8px] uppercase tracking-wider text-orange-400">
                            Current status
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="grid gap-6 border-t border-white/[0.07] p-5 sm:grid-cols-[1fr_0.7fr] sm:p-8">
              <div>
                <h3 className="mb-4 text-lg font-bold">Items</h3>
                <ul className="divide-y divide-white/[0.07]">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 py-4">
                      <div>
                        <p className="text-xs text-white/80">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-[9px] text-white/40">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-orange-400">
                        {formatMoney(item.productPrice * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-fit border border-white/[0.07] p-4">
                <h3 className="text-sm font-bold">Summary</h3>
                <dl className="mt-4 space-y-3 text-[10px]">
                  <div className="flex justify-between gap-3 text-white/50">
                    <dt>Subtotal</dt>
                    <dd>{formatMoney(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-white/50">
                    <dt>Delivery</dt>
                    <dd>{formatMoney(order.deliveryFee)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-white/[0.07] pt-3 font-bold text-white">
                    <dt>Total</dt>
                    <dd className="text-orange-400">{formatMoney(order.total)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[9px] capitalize text-white/40">
                  {order.deliveryMethod} · {order.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/account/orders"
            className="mx-auto mt-6 flex w-fit items-center gap-2 text-[9px] uppercase tracking-wider text-white/50 transition hover:text-orange-400"
          >
            <ArrowLeft size={13} />
            View my orders
          </Link>
        </section>
      )}
    </main>
  );
}
