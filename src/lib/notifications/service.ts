/**
 * @file src/lib/notifications/service.ts
 *
 * Server-side Order Notification Service
 *
 * Guarantees:
 * 1. Strict server-side execution (never trusts client-triggered notifications).
 * 2. Idempotency & Deduplication: Prevents duplicate notifications for the same order & event.
 * 3. Non-blocking & Resilient: Failures are safely logged and will never break order creation.
 * 4. Safe logging: Sensitive recipient data is masked.
 */

import { prisma } from "@/lib/prisma";
import { generateNotificationEmail } from "./templates";
import { getEmailProvider } from "./providers";
import {
  EmailSendResult,
  NotificationEventType,
  NotificationOrderData,
} from "./types";

// In-memory deduplication set with TTL to prevent duplicate notifications during retries/races
const recentlySentCache = new Map<string, number>();
const DEDUPLICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanupOldCacheEntries() {
  const now = Date.now();
  for (const [key, timestamp] of recentlySentCache.entries()) {
    if (now - timestamp > DEDUPLICATION_TTL_MS) {
      recentlySentCache.delete(key);
    }
  }
}

/**
 * Maps Prisma OrderStatus string to a NotificationEventType.
 */
export function mapOrderStatusToNotificationEvent(
  status: string
): NotificationEventType | null {
  switch (status.toUpperCase()) {
    case "PENDING":
      return "ORDER_PLACED";
    case "CONFIRMED":
      return "ORDER_CONFIRMED";
    case "PROCESSING":
      return "ORDER_PROCESSING";
    case "SHIPPED":
      return "ORDER_SHIPPED";
    case "READY_FOR_PICKUP":
      return "READY_FOR_PICKUP";
    case "COMPLETED":
      return "ORDER_COMPLETED";
    case "CANCELLED":
      return "ORDER_CANCELLED";
    default:
      return null;
  }
}

/**
 * Sends an order notification to the customer.
 *
 * CRITICAL RULE:
 * This function NEVER throws an error to the caller.
 * Order creation and status updates must succeed even if email delivery fails.
 */
export async function sendOrderNotification(params: {
  order: NotificationOrderData;
  eventType: NotificationEventType;
}): Promise<EmailSendResult> {
  const { order, eventType } = params;

  // Validate customer email
  if (
    !order.customerEmail ||
    !order.customerEmail.includes("@") ||
    !order.customerEmail.trim()
  ) {
    return {
      success: true,
      skipped: true,
      provider: "none",
      error: "No valid recipient email address on order.",
    };
  }

  // Deduplication key: orderId + eventType
  const deduplicationKey = `${order.id}:${eventType}`;
  cleanupOldCacheEntries();

  if (recentlySentCache.has(deduplicationKey)) {
    return {
      success: true,
      skipped: true,
      provider: "deduplication_guard",
    };
  }

  try {
    if (order.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: order.customerId },
        select: { orderUpdateEmailsEnabled: true },
      });
      if (!customer?.orderUpdateEmailsEnabled) {
        return {
          success: true,
          skipped: true,
          provider: "customer_preferences",
        };
      }
    }

    const template = generateNotificationEmail(order, eventType);
    const provider = getEmailProvider();

    const result = await provider.sendEmail({
      to: order.customerEmail.trim(),
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      recentlySentCache.set(deduplicationKey, Date.now());
    }

    return result;
  } catch (error) {
    console.error(
      "[NOTIFICATION ERROR] Failed to dispatch order notification.",
      { eventType }
    );

    return {
      success: false,
      provider: "service_error",
      error:
        error instanceof Error ? error.message : "Notification dispatch failed.",
    };
  }
}

export async function sendWishlistRestockNotifications(
  productId: string
): Promise<void> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, slug: true },
    });
    if (!product) return;

    const subscribers = await prisma.wishlistItem.findMany({
      where: {
        productId,
        customer: { restockAlertsEnabled: true },
      },
      select: { customer: { select: { email: true } } },
    });
    if (subscribers.length === 0) return;

    const safeName = escapeHtml(product.name);
    const productUrl = new URL(
      `/products/${encodeURIComponent(product.slug)}`,
      process.env.NEXT_PUBLIC_SITE_URL || "https://primezora.com"
    ).toString();
    const safeUrl = escapeHtml(productUrl);
    const provider = getEmailProvider();
    let failedCount = 0;

    for (const { customer } of subscribers) {
      try {
        const result = await provider.sendEmail({
          to: customer.email,
          subject: `${product.name} is back in stock | Primezora Technologies`,
          html: `<p>Good news — <strong>${safeName}</strong>, a product on your wishlist, is available again.</p><p><a href="${safeUrl}">View product</a></p>`,
          text: `Good news — ${product.name}, a product on your wishlist, is available again.\n\nView product: ${productUrl}`,
        });
        if (!result.success) failedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error("WISHLIST RESTOCK EMAIL ERROR:", error);
      }
    }

    if (failedCount > 0) {
      console.error("WISHLIST RESTOCK EMAILS PARTIALLY FAILED:", {
        productId,
        failedCount,
        subscriberCount: subscribers.length,
      });
    }
  } catch (error) {
    console.error("WISHLIST RESTOCK NOTIFICATION ERROR:", error);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/**
 * Convenience function to fetch an order by ID and dispatch a notification.
 */
export async function triggerOrderNotificationById(
  orderId: string,
  eventType: NotificationEventType
): Promise<EmailSendResult> {
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            productPrice: true,
          },
        },
      },
    });

    if (!fullOrder) {
      return {
        success: false,
        provider: "none",
        error: "Order not found",
      };
    }

    return await sendOrderNotification({
      order: fullOrder,
      eventType,
    });
  } catch {
    console.error(
      "[NOTIFICATION ERROR] Failed to fetch order for notification.",
      { eventType }
    );
    return {
      success: false,
      provider: "db_error",
      error: "Failed to fetch order for notification",
    };
  }
}
