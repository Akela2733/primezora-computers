import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAllowedOrderTransitions,
  isOrderStatus,
} from "@/lib/order-status";
import { requireAdminOrdersApi } from "@/lib/admin-orders-auth";
import {
  mapOrderStatusToNotificationEvent,
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

    const { order, previousStatus } = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
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

      const update = await tx.order.updateMany({
        where: { id, status: currentOrder.status },
        data: { status: requestedStatus },
      });
      if (update.count !== 1) {
        throw new InvalidOrderTransitionError(
          "Order status changed elsewhere. Refresh and try again."
        );
      }

      if (requestedStatus === "CANCELLED") {
        for (const item of currentOrder.items) {
          const restoredProduct = await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
            select: { stockQuantity: true },
          });

          if (item.quantity > 0 && restoredProduct.stockQuantity > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { inStock: true },
            });
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

      return {
        previousStatus: currentOrder.status,
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