import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAllowedOrderTransitions,
  isOrderStatus,
} from "@/lib/order-status";
import { requireAdminOrdersApi } from "@/lib/admin-orders-auth";
import {
  mapOrderStatusToNotificationEvent,
  sendWishlistRestockNotifications,
  triggerOrderNotificationById,
} from "@/lib/notifications";
import { INPUT_LIMITS, exceedsTextLimit } from "@/lib/input-limits";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const authError = await requireAdminOrdersApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    if (exceedsTextLimit(id, INPUT_LIMITS.order.id)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        deliveryMethod: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentReference: true,
        paymentVerifiedBy: true,
        paymentVerifiedAt: true,
        paymentTransactionId: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            productPrice: true,
            quantity: true,
            product: { select: { image: true } },
          },
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            changedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        paymentReceipts: {
          select: {
            id: true,
            contentType: true,
            sizeBytes: true,
            status: true,
            rejectionReason: true,
            submittedAt: true,
            reviewedAt: true,
          },
          orderBy: { submittedAt: "desc" },
        },
        paymentAuditEvents: {
          select: {
            action: true,
            changedBy: true,
            reason: true,
            transactionId: true,
            transactionReference: true,
            transactionDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("ADMIN ORDER DETAIL API ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load this order. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const authError = await requireAdminOrdersApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    if (exceedsTextLimit(id, INPUT_LIMITS.order.id)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "A valid order status is required." },
        { status: 400 }
      );
    }

    const requestedStatus = (body as Record<string, unknown>).status;
    if (!isOrderStatus(requestedStatus)) {
      return NextResponse.json(
        { error: "A valid order status is required." },
        { status: 400 }
      );
    }

    const { order, previousStatus, restockedProductIds } = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          deliveryMethod: true,
          items: {
            select: { productId: true, quantity: true },
          },
        },
      });

      if (!currentOrder) {
        throw new OrderNotFoundError();
      }

      const allowedStatuses = getAllowedOrderTransitions(
        currentOrder.status,
        currentOrder.deliveryMethod
      );
      if (!allowedStatuses.includes(requestedStatus)) {
        throw new InvalidOrderTransitionError(
          `Cannot change an order from ${currentOrder.status} to ${requestedStatus}.`
        );
      }
      if (
        currentOrder.paymentMethod === "bank" &&
        currentOrder.paymentStatus !== "PAID" &&
        requestedStatus !== "CANCELLED"
      ) {
        throw new InvalidOrderTransitionError(
          "Bank-transfer orders cannot be confirmed or dispatched before payment is verified."
        );
      }
      if (
        currentOrder.paymentMethod === "bank" &&
        currentOrder.paymentStatus === "PAID" &&
        requestedStatus === "CANCELLED"
      ) {
        throw new InvalidOrderTransitionError(
          "A verified bank payment cannot be cancelled here. Follow the refund process first."
        );
      }

      const update = await tx.order.updateMany({
        where: { id, status: currentOrder.status },
        data: {
          status: requestedStatus,
          ...(requestedStatus === "CANCELLED" &&
          currentOrder.paymentMethod === "bank"
            ? { paymentStatus: "CANCELLED" as const }
            : {}),
        },
      });
      if (update.count !== 1) {
        throw new InvalidOrderTransitionError(
          "Order status changed elsewhere. Refresh and try again."
        );
      }

      const restockedProductIds: string[] = [];
      if (requestedStatus === "CANCELLED") {
        for (const item of currentOrder.items) {
          const previousProduct = await tx.product.findUnique({
            where: { id: item.productId },
            select: { inStock: true, stockQuantity: true },
          });
          const restoredProduct = await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
            select: { stockQuantity: true },
          });

          if (
            item.quantity > 0 &&
            restoredProduct.stockQuantity > 0 &&
            previousProduct?.stockQuantity === 0
          ) {
            await tx.product.update({
              where: { id: item.productId },
              data: { inStock: true },
            });
            restockedProductIds.push(item.productId);
          }
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: currentOrder.status,
          toStatus: requestedStatus,
          changedBy: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin",
        },
      });
      if (
        requestedStatus === "CANCELLED" &&
        currentOrder.paymentMethod === "bank"
      ) {
        await tx.paymentAuditEvent.create({
          data: {
            orderId: id,
            action: "BANK_ORDER_CANCELLED",
            changedBy: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin",
          },
        });
      }

      return {
        previousStatus: currentOrder.status,
        restockedProductIds,
        order: {
          id: currentOrder.id,
          orderNumber: currentOrder.orderNumber,
          status: requestedStatus,
        },
      };
    }, {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 10_000,
    });

    // Trigger Notification for the new status (non-blocking for admin UI)
    const notificationEvent = mapOrderStatusToNotificationEvent(requestedStatus);
    if (notificationEvent) {
      triggerOrderNotificationById(order.id, notificationEvent).catch((notifyErr) => {
        console.error("NOTIFICATION DISPATCH TRIGGER ERROR:", notifyErr);
      });
    }
    for (const productId of new Set(restockedProductIds)) {
      void sendWishlistRestockNotifications(productId);
    }

    return NextResponse.json({
      success: true,
      previousStatus,
      order,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (error instanceof InvalidOrderTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in status update." },
        { status: 400 }
      );
    }

    console.error("UPDATE ORDER STATUS ERROR:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Order changed while updating. Refresh and try again." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update order status." },
      { status: 500 }
    );
  }
}

class OrderNotFoundError extends Error {}

class InvalidOrderTransitionError extends Error {}