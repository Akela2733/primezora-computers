import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type PaymentCancelPageProps = {
  searchParams: Promise<{ order?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function PaymentCancelPage({
  searchParams,
}: PaymentCancelPageProps) {
  const params = await searchParams;
  const orderNumber =
    typeof params.order === "string" ? params.order.trim() : "";
  if (!orderNumber || orderNumber.length > 64) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { orderNumber: true, status: true },
  });
  if (!order) notFound();

  return (
    <main className="min-h-[70vh] bg-[#030505] px-4 py-20 text-white/90">
      <section className="mx-auto max-w-xl text-center">
        <CircleAlert size={38} className="mx-auto text-amber-500" />
        <p className="mt-6 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">
          Card payment not completed
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase">
          Your order is still being checked
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/55">
          PayHere did not return a completed payment. If you attempted payment,
          allow a short time for the provider to send its final status before
          placing another order.
        </p>
        <p className="mt-5 text-sm text-white/60">
          Order reference:{" "}
          <span className="font-semibold text-amber-500">
            {order.orderNumber}
          </span>
        </p>
        <Link
          href={`/order-success?order=${encodeURIComponent(order.orderNumber)}`}
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-5 text-xs font-semibold uppercase tracking-[0.1em] text-white/75 transition hover:border-amber-500/40 hover:text-amber-400"
        >
          <ArrowLeft size={14} />
          View order status ({order.status.toLowerCase()})
        </Link>
      </section>
    </main>
  );
}
