import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getPayHereConfiguration,
  PaymentConfigurationError,
  verifyPayHereNotificationSignature,
} from "@/lib/payment-configuration";
import { triggerOrderNotificationById } from "@/lib/notifications";

const MAX_NOTIFICATION_LENGTH = 16_384;

function textResponse(message: string, status: number): NextResponse {
  return new NextResponse(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function getField(form: URLSearchParams, name: string): string {
  return form.get(name)?.trim() ?? "";
}

export async function POST(request: Request) {
  try {
    getPayHereConfiguration();
  } catch (error) {
    console.error("PAYHERE_CONFIGURATION_UNAVAILABLE", error);
    return textResponse(
      error instanceof PaymentConfigurationError
        ? "Payment notification is not configured."
        : "Payment notification failed.",
      503
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch (error) {
    console.error("PAYHERE_NOTIFICATION_BODY_READ_FAILED", error);
    return textResponse("Unable to read payment notification.", 400);
  }
  if (body.length > MAX_NOTIFICATION_LENGTH) {
    return textResponse("Payment notification is too large.", 413);
  }

  const form = new URLSearchParams(body);
  const merchantId = getField(form, "merchant_id");
  const orderNumber = getField(form, "order_id");
  const amount = getField(form, "payhere_amount");
  const currency = getField(form, "payhere_currency");
  const statusCode = getField(form, "status_code");
  const signature = getField(form, "md5sig");
  const paymentId = getField(form, "payment_id");

  if (
    !merchantId ||
    !orderNumber ||
    orderNumber.length > 64 ||
    !amount ||
    !currency ||
    !statusCode ||
    !signature ||
    !paymentId ||
    paymentId.length > 128
  ) {
    return textResponse("Payment notification is incomplete.", 400);
  }

  let signatureIsValid = false;
  try {
    signatureIsValid = verifyPayHereNotificationSignature({
      merchantId,
      orderId: orderNumber,
      amount,
      currency,
      statusCode,
      signature,
    });
  } catch (error) {
    console.error("PAYHERE_SIGNATURE_VERIFICATION_FAILED", error);
    return textResponse("Payment notification verification is unavailable.", 503);
  }
  if (!signatureIsValid) {
    return textResponse("Invalid payment notification signature.", 400);
  }

  if (!/^\d+\.\d{2}$/.test(amount) || currency !== "LKR") {
    return textResponse("Invalid payment amount or currency.", 400);
  }

  if (!["2", "-1", "-2", "-3"].includes(statusCode)) {
    return textResponse("Unsupported payment status.", 400);
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentMethod: true,
        status: true,
        paymentTransactionId: true,
        notes: true,
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!order || order.paymentMethod !== "card") {
      return textResponse("Order not found.", 404);
    }
    if (amount !== order.total.toFixed(2)) {
      return textResponse("Payment amount does not match the order.", 400);
    }
    if (order.paymentTransactionId === paymentId) {
      return textResponse("OK", 200);
    }

    if (statusCode === "2") {
      if (order.status !== "PENDING") {
        const duplicatePaymentNote =
          `[PayHere: successful payment ${paymentId} received for an order already in ${order.status} at ${new Date().toISOString()}; review for refund]`;
        await prisma.order.update({
          where: { id: order.id },
          data: {
            notes: order.notes
              ? `${order.notes}\n${duplicatePaymentNote}`
              : duplicatePaymentNote,
          },
        });
        console.error(
          "PAYHERE_SUCCESSFUL_PAYMENT_FOR_NON_PENDING_ORDER",
          { orderNumber, status: order.status }
        );
        return textResponse("OK", 200);
      }

      let confirmed = false;
      await prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id: order.id },
          select: {
            status: true,
            paymentTransactionId: true,
            notes: true,
          },
        });
        if (
          !currentOrder ||
          currentOrder.status !== "PENDING" ||
          currentOrder.paymentTransactionId
        ) {
          return;
        }

        const transactionNote =
          `[PayHere: confirmed payment ${paymentId} at ${new Date().toISOString()}]`;
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING",
            paymentTransactionId: null,
          },
          data: {
            status: "CONFIRMED",
            paymentTransactionId: paymentId,
            notes: currentOrder.notes
              ? `${currentOrder.notes}\n${transactionNote}`
              : transactionNote,
          },
        });
        confirmed = updated.count === 1;
      });

      if (confirmed) {
        triggerOrderNotificationById(order.id, "ORDER_CONFIRMED").catch((error) => {
          console.error("PAYHERE_ORDER_CONFIRMATION_NOTIFICATION_FAILED", error);
        });
      }
      return textResponse("OK", 200);
    }

    if (statusCode === "-1" || statusCode === "-2") {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING", paymentMethod: "card" },
          data: {
            status: "CANCELLED",
            notes: order.notes
              ? `${order.notes}\n[PayHere: payment ${statusCode} at ${new Date().toISOString()}]`
              : `[PayHere: payment ${statusCode} at ${new Date().toISOString()}]`,
          },
        });
        if (updated.count !== 1) return;

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              inStock: true,
            },
          });
        }
      });
      return textResponse("OK", 200);
    }

    const chargebackNote = `[PayHere: chargeback notification for payment ${paymentId} at ${new Date().toISOString()}]`;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: order.notes
          ? `${order.notes}\n${chargebackNote}`
          : chargebackNote,
      },
    });
    return textResponse("OK", 200);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return textResponse("OK", 200);
    }
    console.error("PAYHERE_NOTIFICATION_PROCESSING_FAILED", error);
    return textResponse("Payment notification processing failed.", 500);
  }
}
