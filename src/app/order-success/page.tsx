import Link from "next/link";
import {
  ArrowRight,
  Check,
  Package,
} from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import BankTransferReceiptUpload from "@/components/customer/BankTransferReceiptUpload";
import {
  getBankTransferDetailsForDisplay,
  getWhatsAppBusinessNumberForDisplay,
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
      paymentStatus: true,
      paymentReference: true,
      currency: true,
      paymentReceipts: {
        select: { rejectionReason: true },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
      createdAt: true,
    },
  });

  if (!order) {
    notFound();
  }

  let bankTransferDetails = null;
  let whatsappBusinessNumber: string | null = null;
  const awaitingCardPayment =
    order.paymentMethod === "card" && order.status === "PENDING";
  const failedCardPayment =
    order.paymentMethod === "card" && order.status === "CANCELLED";
  if (order.paymentMethod === "bank") {
    try {
      bankTransferDetails = getBankTransferDetailsForDisplay();
      whatsappBusinessNumber = getWhatsAppBusinessNumberForDisplay();
    } catch (error) {
      if (!(error instanceof PaymentConfigurationError)) throw error;
      console.error("BANK_TRANSFER_DETAILS_UNAVAILABLE", error);
    }
  }
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
              {order.paymentMethod === "bank" &&
              order.paymentStatus !== "PAID"
                ? "Awaiting Payment Verification"
                : awaitingCardPayment
                  ? "Payment Verification Pending"
                  : failedCardPayment
                    ? "Card Payment Not Completed"
                    : order.status === "PENDING"
                      ? "Order Received"
                      : "Order Confirmed"}
            </p>

            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">
              {order.paymentMethod === "bank" &&
              order.paymentStatus !== "PAID"
                ? "Transfer the exact amount"
                : awaitingCardPayment
                  ? "We’re confirming payment"
                  : failedCardPayment
                    ? "Payment was not completed"
                    : "Thank You"}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45">
              {order.paymentMethod === "bank" &&
              order.paymentStatus !== "PAID"
                ? "Your order is reserved. Transfer the exact amount using the unique payment reference, then upload your receipt. Payment is confirmed only after Primezora verifies the incoming bank credit."
                : awaitingCardPayment
                  ? "PayHere is processing your card payment. This page will reflect the order status after the provider notifies us. Please keep your order number for reference."
                  : failedCardPayment
                    ? "PayHere did not complete this payment. If you believe you were charged, contact support with your order number."
                    : order.paymentMethod === "card"
                      ? "Your card payment was verified. We will contact you with the next order update."
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
                Total <strong className="ml-2 text-white/75">{order.currency} {order.total.toLocaleString("en-LK")}</strong>
              </span>
              <span>
                Status <strong className="ml-2 text-amber-600">{order.paymentMethod === "bank" ? (order.paymentStatus ?? "PAYMENT_PENDING").replaceAll("_", " ") : order.status.replaceAll("_", " ")}</strong>
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
                {order.paymentStatus === "PAID"
                  ? "Bank transfer verified"
                  : "Complete your bank transfer"}
              </h2>
              {order.paymentStatus === "PAID" ? (
                <p className="mt-3 text-sm leading-7 text-emerald-300">
                  The bank credit has been verified and your order is confirmed.
                </p>
              ) : bankTransferDetails ? (
                <>
                  <dl className="mx-auto mt-6 grid max-w-md gap-3 text-left text-sm">
                    {[
                      ["Bank", bankTransferDetails.bankName],
                        ["Account holder", bankTransferDetails.accountName],
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
                    Transfer exactly {order.currency} {order.total.toLocaleString("en-LK")} and enter{" "}
                    <strong className="text-amber-500">{order.paymentReference ?? order.orderNumber}</strong>{" "}
                    as the payment reference. Your order remains unpaid until the incoming credit is independently verified.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-amber-300">
                  Bank transfer details are temporarily unavailable. Please
                  contact support and quote your order number.
                </p>
              )}
              {order.paymentStatus !== "PAID" && whatsappBusinessNumber && (
                <div className="mt-6">
                  <a
                    href={`https://wa.me/${whatsappBusinessNumber}?text=${encodeURIComponent(
                      `Hi Primezora! I would like to pay for order ${order.orderNumber} by bank transfer. Amount: LKR ${order.total.toLocaleString("en-LK")}. Please confirm the payment instructions.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-emerald-500"
                  >
                    Message Primezora on WhatsApp
                  </a>
                  <p className="mx-auto mt-3 max-w-md text-[10px] leading-5 text-white/40">
                    WhatsApp opens a prefilled message; you must press Send.
                    Order-specific replies are manually sent by Primezora using
                    the WhatsApp Business app. Configure a saved Quick Reply
                    with the bank details and payment instructions in that
                    app; it does not read order data or create automatic
                    order-specific replies.
                  </p>
                </div>
              )}
              <BankTransferReceiptUpload
                orderId={order.id}
                paymentStatus={order.paymentStatus ?? "PAYMENT_PENDING"}
                rejectionReason={order.paymentReceipts[0]?.rejectionReason}
              />
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