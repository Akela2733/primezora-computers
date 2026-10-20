import { NextResponse } from "next/server";

import { requireAdminOrdersApi } from "@/lib/admin-orders-auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { triggerOrderNotificationById } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PaymentReviewInput =
  | {
      action: "reject";
      receiptId: string;
      reason: string;
    }
  | {
      action: "approve";
      receiptId: string;
      transactionId: string;
      transactionReference: string;
      transactionDate: Date;
    };

class InvalidPaymentReviewError extends Error {}

function readBoundedText(
  value: unknown,
  field: string,
  maximum: number
): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maximum ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new InvalidPaymentReviewError(`${field} is invalid.`);
  }
  return value.trim();
}

function parseReviewInput(value: unknown): PaymentReviewInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidPaymentReviewError("A valid payment review is required.");
  }

  const body = value as Record<string, unknown>;
  const receiptId = readBoundedText(body.receiptId, "Receipt", 128);
  if (body.action === "reject") {
    return {
      action: "reject",
      receiptId,
      reason: readBoundedText(body.reason, "Rejection reason", 500),
    };
  }
  if (body.action !== "approve" || body.confirmBankVerification !== true) {
    throw new InvalidPaymentReviewError(
      "Approval requires confirmation of the official bank credit."
    );
  }

  const transactionDateText = readBoundedText(
    body.transactionDate,
    "Transaction date",
    32
  );
  const transactionDate = new Date(`${transactionDateText}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(transactionDateText) ||
    !Number.isFinite(transactionDate.getTime()) ||
    transactionDate.toISOString().slice(0, 10) !== transactionDateText ||
    transactionDate.getTime() > Date.now()
  ) {
    throw new InvalidPaymentReviewError("Transaction date is invalid.");
  }

  return {
    action: "approve",
    receiptId,
    transactionId: readBoundedText(body.transactionId, "Transaction ID", 128),
    transactionReference: readBoundedText(
      body.transactionReference,
      "Transaction reference",
      128
    ),
    transactionDate,
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authError = await requireAdminOrdersApi();
  if (authError) return authError;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json(
      { error: "Administrator identity is not configured." },
      { status: 503 }
    );
  }

  const limited = await enforceRateLimits(request, [
    { policy: "adminPaymentReview", identifier: `admin:${adminEmail}` },
    { policy: "adminPaymentReview", identifier: getClientIp(request) },
  ]);
  if (limited) return limited;

  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  let input: PaymentReviewInput;
  try {
    input = parseReviewInput(await request.json());
  } catch (error) {
    if (error instanceof InvalidPaymentReviewError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in payment review." }, { status: 400 });
    }
    console.error("ADMIN_PAYMENT_REVIEW_REQUEST_PARSE_FAILED", error);
    return NextResponse.json(
      { error: "Invalid payment review request." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            paymentTransactionId: true,
            status: true,
          },
        });
        if (!order) throw new InvalidPaymentReviewError("Order not found.");
        if (
          order.paymentMethod !== "bank" ||
          order.paymentStatus !== "PAYMENT_VERIFICATION_PENDING" ||
          order.status === "CANCELLED" ||
          order.paymentTransactionId
        ) {
          throw new InvalidPaymentReviewError(
            "This order is not awaiting bank-transfer verification."
          );
        }

        const receipt = await tx.paymentReceipt.findFirst({
          where: {
            id: input.receiptId,
            orderId: id,
            status: "PENDING",
          },
          select: { id: true },
        });
        if (!receipt) {
          throw new InvalidPaymentReviewError(
            "The submitted receipt is no longer awaiting review."
          );
        }

        const now = new Date();
        const changedOrder = await tx.order.updateMany({
          where: {
            id,
            paymentMethod: "bank",
            paymentStatus: "PAYMENT_VERIFICATION_PENDING",
            status: order.status,
            paymentTransactionId: null,
          },
          data:
            input.action === "approve"
              ? {
                  paymentStatus: "PAID",
                  paymentTransactionId: input.transactionId,
                  paymentVerifiedBy: adminEmail,
                  paymentVerifiedAt: now,
                  ...(order.status === "PENDING"
                    ? { status: "CONFIRMED" as const }
                    : {}),
                }
              : { paymentStatus: "PAYMENT_REJECTED" },
        });
        if (changedOrder.count !== 1) {
          throw new InvalidPaymentReviewError(
            "Order payment status changed. Refresh and try again."
          );
        }

        const changedReceipt = await tx.paymentReceipt.updateMany({
          where: { id: receipt.id, orderId: id, status: "PENDING" },
          data: {
            status: input.action === "approve" ? "APPROVED" : "REJECTED",
            reviewedAt: now,
            rejectionReason:
              input.action === "reject" ? input.reason : null,
          },
        });
        if (changedReceipt.count !== 1) {
          throw new InvalidPaymentReviewError(
            "Receipt status changed. Refresh and try again."
          );
        }

        if (input.action === "approve" && order.status === "PENDING") {
          await tx.orderStatusHistory.create({
            data: {
              orderId: id,
              fromStatus: "PENDING",
              toStatus: "CONFIRMED",
              changedBy: adminEmail,
            },
          });
        }

        await tx.paymentAuditEvent.create({
          data: {
            orderId: id,
            receiptId: receipt.id,
            action:
              input.action === "approve"
                ? "BANK_PAYMENT_APPROVED"
                : "RECEIPT_REJECTED",
            changedBy: adminEmail,
            reason: input.action === "reject" ? input.reason : null,
            transactionId:
              input.action === "approve" ? input.transactionId : null,
            transactionReference:
              input.action === "approve"
                ? input.transactionReference
                : null,
            transactionDate:
              input.action === "approve" ? input.transactionDate : null,
          },
        });

        return {
          orderNumber: order.orderNumber,
          total: order.total,
          paymentStatus:
            input.action === "approve" ? "PAID" : "PAYMENT_REJECTED",
          status:
            input.action === "approve" && order.status === "PENDING"
              ? "CONFIRMED"
              : order.status,
          newlyConfirmed: input.action === "approve" && order.status === "PENDING",
        };
      },
      {
        isolationLevel: "Serializable",
        maxWait: 5_000,
        timeout: 10_000,
      }
    );

    if (result.newlyConfirmed) {
      void triggerOrderNotificationById(id, "ORDER_CONFIRMED").catch((error) => {
        console.error("BANK_PAYMENT_CONFIRMATION_NOTIFICATION_FAILED", error);
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof InvalidPaymentReviewError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Order not found." ? 404 : 409 }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That bank transaction ID has already been used." },
        { status: 409 }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Payment changed during review. Refresh and try again." },
        { status: 409 }
      );
    }
    console.error("ADMIN_BANK_PAYMENT_REVIEW_FAILED", error);
    return NextResponse.json(
      { error: "Unable to update this payment. Please try again." },
      { status: 500 }
    );
  }
}
