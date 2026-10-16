import Link from "next/link";
import {
  ArrowRight,
  Check,
  Package,
} from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getBankTransferDetailsForDisplay,
  PaymentConfigurationError,
} from "@/lib/payment-configuration";

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
      paymentMethod: true,
      createdAt: true,
    },
  });

  if (!order) {
    notFound();
  }

  let bankTransferDetails = null;
  if (order.paymentMethod === "bank") {
    try {
      bankTransferDetails = getBankTransferDetailsForDisplay();
    } catch (error) {
      if (!(error instanceof PaymentConfigurationError)) throw error;
      console.error("BANK_TRANSFER_DETAILS_UNAVAILABLE", error);
    }
  }
  const awaitingCardPayment =
    order.paymentMethod === "card" && order.status === "PENDING";
  const failedCardPayment =
    order.paymentMethod === "card" && order.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(217,119,6,0.13),transparent_35%)]" />

        <div className="container-primezora relative py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-600/30 bg-amber-600/10">
              <Check
                size={34}
                className="text-amber-600"
              />
            </div>

            <p className="mt-8 font-display text-[9px] uppercase tracking-[0.35em] text-amber-600">
              {awaitingCardPayment
                ? "Payment Verification Pending"
                : failedCardPayment
                  ? "Card Payment Not Completed"
                  : order.status === "PENDING"
                    ? "Order Received"
                    : "Order Confirmed"}
            </p>

            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">
              {awaitingCardPayment
                ? "We’re confirming payment"
                : failedCardPayment
                  ? "Payment was not completed"
                  : "Thank You"}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45">
              {awaitingCardPayment
                ? "PayHere is processing your card payment. This page will reflect the order status after the provider notifies us. Please keep your order number for reference."
                : failedCardPayment
                  ? "PayHere did not complete this payment. If you believe you were charged, contact support with your order number before placing another order."
                  : order.paymentMethod === "bank"
                  ? "Your order has been received. It will be confirmed after your bank transfer is verified."
                  : "Your order has been successfully placed and is now being processed."}
            </p>

            <div className="mx-auto mt-8 inline-flex items-center gap-3 border border-amber-600/20 bg-amber-600/[0.06] px-5 py-3">
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                Order Number
              </span>

              <span className="font-display text-sm font-bold text-amber-600">
                {order.orderNumber}
              </span>
            </div>

            <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[9px] uppercase tracking-[0.12em] text-white/40">
              <span>
                Total <strong className="ml-2 text-white/75">LKR {order.total.toLocaleString("en-LK")}</strong>
              </span>
              <span>
                Status <strong className="ml-2 text-amber-600">{order.status.replaceAll("_", " ")}</strong>
              </span>
              <span>
                Placed <strong className="ml-2 text-white/75">{order.createdAt.toLocaleDateString("en-LK")}</strong>
              </span>
            </div>

            <Link
              href="/shop"
              className="mt-10 inline-flex items-center gap-2 bg-amber-600 px-7 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-amber-600"
            >
              Continue Shopping
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-primezora py-12 sm:py-16">
        <div className="mx-auto max-w-2xl border border-white/[0.07] bg-[#030505] p-8 text-center">
          <Package
            size={34}
            className="mx-auto text-amber-600"
          />

          {order.paymentMethod === "bank" ? (
            <>
              <h2 className="mt-5 font-display text-lg font-bold uppercase tracking-[0.18em] text-white/80">
                Complete your bank transfer
              </h2>
              {bankTransferDetails ? (
                <>
                  <dl className="mx-auto mt-6 grid max-w-md gap-3 text-left text-sm">
                    {[
                      ["Bank", bankTransferDetails.bankName],
                      ["Account name", bankTransferDetails.accountName],
                      ["Account number", bankTransferDetails.accountNumber],
                      ["Branch", bankTransferDetails.branch],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex flex-wrap justify-between gap-2 border-b border-white/[0.07] pb-3"
                      >
                        <dt className="text-white/45">{label}</dt>
                        <dd className="font-medium text-white/85">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-5 text-sm leading-7 text-white/50">
                    Transfer LKR {order.total.toLocaleString("en-LK")} and use{" "}
                    <strong className="text-amber-500">{order.orderNumber}</strong>{" "}
                    as the payment reference. Your order remains pending until
                    the transfer is verified.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-amber-300">
                  Bank transfer details are temporarily unavailable. Please
                  contact support and quote your order number.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-5 font-display text-lg font-bold uppercase tracking-[0.18em] text-white/80">
                {awaitingCardPayment
                  ? "Awaiting PayHere confirmation"
                  : failedCardPayment
                    ? "No payment was confirmed"
                    : "Your order is on the way"}
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/40">
                {awaitingCardPayment
                  ? "Your order will be confirmed after PayHere verifies your card payment. Refresh this page in a moment to check for updates."
                  : failedCardPayment
                    ? "The order was cancelled and reserved stock was released. You can return to checkout to try again."
                    : "We will contact you shortly with the next update for your delivery or pickup."}
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}