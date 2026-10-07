/**
 * @file src/lib/payment-server.ts
 *
 * Server-Side Payment Operations & Verification Service
 *
 * Implements server-side payment lifecycle management:
 * 1. Intent creation with server-computed order amounts (never client-provided).
 * 2. Strict server-side verification (rejects any client claims of "payment succeeded").
 * 3. Atomic status transitions via Prisma serializable transactions.
 * 4. Idempotency guards to prevent duplicate payment processing or double-charging.
 */

import { prisma } from "@/lib/prisma";
import {
  getPaymentProvider,
  isSupportedPaymentMethod,
  type PaymentIntentResult,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/payment";

export class PaymentProcessingError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "PaymentProcessingError";
  }
}

export interface VerifyOrderPaymentInput {
  orderId: string;
  customerId: string;
  paymentIntentId?: string;
  verificationPayload?: Record<string, unknown>;
  signature?: string;
}

export interface VerifyOrderPaymentResult {
  success: boolean;
  alreadyProcessed: boolean;
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  transactionId?: string;
  message?: string;
  failureReason?: string;
}

/**
 * Creates or retrieves a payment intent for an existing order.
 * Order total and customer info are strictly loaded from the database.
 */
export async function createPaymentIntentForOrder(
  orderId: string
): Promise<PaymentIntentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentMethod: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
    },
  });

  if (!order) {
    throw new PaymentProcessingError("Order not found.", 404);
  }

  if (order.status !== "PENDING") {
    throw new PaymentProcessingError(
      `Order is in ${order.status} status and cannot initiate new payment.`,
      409
    );
  }

  if (!isSupportedPaymentMethod(order.paymentMethod)) {
    throw new PaymentProcessingError(
      `Unsupported payment method: ${order.paymentMethod}`,
      400
    );
  }

  const provider = getPaymentProvider(order.paymentMethod);
  return provider.createPaymentIntent({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: "LKR",
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
  });
}

/**
 * Strictly verifies and records payment confirmation on the server.
 *
 * Key Security Guarantees:
 * - Never marks an order as paid merely because client says it succeeded.
 * - Enforces idempotency to prevent duplicate payment processing.
 * - Uses serializable transaction isolation to eliminate race conditions.
 */
export async function verifyAndProcessOrderPayment(
  input: VerifyOrderPaymentInput
): Promise<VerifyOrderPaymentResult> {
  if (!input.orderId || typeof input.orderId !== "string") {
    throw new PaymentProcessingError("Order ID is required.", 400);
  }

  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          customerId: input.customerId,
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentMethod: true,
          status: true,
          notes: true,
        },
      });

      if (!order) {
        throw new PaymentProcessingError("Order not found.", 404);
      }

      // Idempotency check: if order is already confirmed, completed, or processing, avoid duplicate processing.
      if (
        order.status === "CONFIRMED" ||
        order.status === "PROCESSING" ||
        order.status === "SHIPPED" ||
        order.status === "READY_FOR_PICKUP" ||
        order.status === "COMPLETED"
      ) {
        return {
          success: true,
          alreadyProcessed: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          message: `Order ${order.orderNumber} has already been verified and processed.`,
        };
      }

      if (order.status === "CANCELLED") {
        throw new PaymentProcessingError(
          `Cannot process payment for cancelled order ${order.orderNumber}.`,
          409
        );
      }

      if (!isSupportedPaymentMethod(order.paymentMethod)) {
        throw new PaymentProcessingError(
          `Unsupported payment method: ${order.paymentMethod}`,
          400
        );
      }

      const provider = getPaymentProvider(order.paymentMethod);

      // Execute provider-specific cryptographic/server verification
      const verification = await provider.verifyPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        expectedAmount: order.total,
        paymentIntentId: input.paymentIntentId,
        verificationPayload: input.verificationPayload,
        signature: input.signature,
      });

      if (!verification.verified) {
        return {
          success: false,
          alreadyProcessed: false,
          orderId: order.id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          failureReason:
            verification.failureReason || "Payment verification failed on provider.",
        };
      }

      // If verified as PAID (e.g. from an online gateway or verified bank confirmation)
      if (verification.paymentStatus === "PAID") {
        const paymentNote = `[Payment: Confirmed ${order.paymentMethod.toUpperCase()} (Tx: ${
          verification.transactionId || "N/A"
        }) at ${verification.timestamp}]`;

        const updatedNotes = order.notes
          ? `${order.notes}\n${paymentNote}`
          : paymentNote;

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "CONFIRMED",
            notes: updatedNotes,
          },
        });

        return {
          success: true,
          alreadyProcessed: false,
          orderId: order.id,
          orderNumber: order.orderNumber,
          currentStatus: "CONFIRMED",
          transactionId: verification.transactionId,
          message: "Payment successfully verified and order confirmed.",
        };
      }

      // For offline methods (COD, Bank Transfer awaiting slip), the status remains PENDING
      return {
        success: true,
        alreadyProcessed: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        transactionId: verification.transactionId,
        message:
          order.paymentMethod === "cod"
            ? "Order placed for Cash on Delivery. Payment will be collected upon delivery."
            : "Order placed for Bank Transfer. Awaiting bank deposit slip verification.",
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
