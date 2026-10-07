import Link from "next/link";
import {
  ArrowRight,
  Check,
  Package,
} from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type OrderSuccessPageProps = {
  searchParams: Promise<{
    order?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const params = await searchParams;
  const orderNumber =
    typeof params.order === "string"
      ? params.order.trim()
      : "";

  if (!orderNumber || orderNumber.length > 64) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.13),transparent_35%)]" />

        <div className="container-primezora relative py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
              <Check
                size={34}
                className="text-orange-400"
              />
            </div>

            <p className="mt-8 font-display text-[9px] uppercase tracking-[0.35em] text-orange-400">
              Order Confirmed
            </p>

            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">
              Thank You
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45">
              Your order has been successfully placed and is now being processed.
            </p>

            <div className="mx-auto mt-8 inline-flex items-center gap-3 border border-orange-500/20 bg-orange-500/[0.06] px-5 py-3">
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                Order Number
              </span>

              <span className="font-display text-sm font-bold text-orange-400">
                {order.orderNumber}
              </span>
            </div>

            <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
              <span>
                Total <strong className="ml-2 text-white/75">LKR {order.total.toLocaleString("en-LK")}</strong>
              </span>
              <span>
                Status <strong className="ml-2 text-orange-300">{order.status.replaceAll("_", " ")}</strong>
              </span>
              <span>
                Placed <strong className="ml-2 text-white/75">{order.createdAt.toLocaleDateString("en-LK")}</strong>
              </span>
            </div>

            <Link
              href="/shop"
              className="mt-10 inline-flex items-center gap-2 bg-orange-500 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
            >
              Continue Shopping
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-primezora py-12 sm:py-16">
        <div className="mx-auto max-w-2xl border border-white/[0.07] bg-[#080d13] p-8 text-center">
          <Package
            size={34}
            className="mx-auto text-orange-400"
          />

          <h2 className="mt-5 font-display text-lg font-bold uppercase tracking-[0.18em] text-white/80">
            Your order is on the way
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/40">
            We will contact you shortly with the next update for your delivery or pickup.
          </p>
        </div>
      </section>
    </main>
  );
}