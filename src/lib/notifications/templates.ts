/**
 * @file src/lib/notifications/templates.ts
 *
 * Reusable HTML and plain-text email templates for all Primezora order notification events.
 */

import {
  NotificationEventType,
  NotificationOrderData,
} from "./types";

interface TemplateContent {
  subject: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  actionNote: string;
}

function getEventContent(
  eventType: NotificationEventType,
  order: NotificationOrderData
): TemplateContent {
  switch (eventType) {
    case "ORDER_PLACED":
      return {
        subject: `Order Placed - ${order.orderNumber} | Primezora Technologies`,
        badge: "ORDER RECEIVED",
        badgeColor: "#f97316",
        title: "Thank You for Your Order!",
        description:
          "We have successfully received your order and are currently verifying product availability.",
        actionNote:
          order.paymentMethod === "bank"
            ? "Payment Instructions: Please complete your bank transfer using your Order Number as the deposit reference and send proof of payment to support@primezora.com."
            : "Cash on Delivery: Please ensure you have exact cash available when the courier arrives.",
      };

    case "ORDER_CONFIRMED":
      return {
        subject: `Order Confirmed - ${order.orderNumber} | Primezora Technologies`,
        badge: "CONFIRMED",
        badgeColor: "#10b981",
        title: "Your Order is Confirmed!",
        description:
          "Your order has been officially confirmed and queued for fulfillment by our team.",
        actionNote:
          "Our technicians are now preparing your hardware components.",
      };

    case "ORDER_PROCESSING":
      return {
        subject: `Processing Order - ${order.orderNumber} | Primezora Technologies`,
        badge: "PROCESSING",
        badgeColor: "#3b82f6",
        title: "We Are Preparing Your Items",
        description:
          "Your items are undergoing quality inspection, packaging, and staging.",
        actionNote:
          "We ensure all electronics and components are thoroughly verified and securely boxed.",
      };

    case "ORDER_SHIPPED":
      return {
        subject: `Your Order Has Shipped! - ${order.orderNumber} | Primezora Technologies`,
        badge: "SHIPPED",
        badgeColor: "#8b5cf6",
        title: "Your Hardware is on the Way!",
        description:
          "Your package has been dispatched with our delivery partner and is en route to your address.",
        actionNote:
          "Please ensure someone is available at the delivery location to receive the parcel.",
      };

    case "READY_FOR_PICKUP":
      return {
        subject: `Ready for Pickup! - ${order.orderNumber} | Primezora Technologies`,
        badge: "READY FOR PICKUP",
        badgeColor: "#06b6d4",
        title: "Your Order is Ready for Collection",
        description:
          "Your items are packed and waiting for you at the Primezora store.",
        actionNote:
          "Please present your Order Number at the store counter to collect your hardware.",
      };

    case "ORDER_COMPLETED":
      return {
        subject: `Order Completed - ${order.orderNumber} | Primezora Technologies`,
        badge: "COMPLETED",
        badgeColor: "#10b981",
        title: "Order Successfully Completed",
        description:
          "Thank you for shopping with Primezora Technologies! Your order has been marked as completed.",
        actionNote:
          "Need technical support or warranty assistance? Contact us at support@primezora.com.",
      };

    case "ORDER_CANCELLED":
      return {
        subject: `Order Cancelled - ${order.orderNumber} | Primezora Technologies`,
        badge: "CANCELLED",
        badgeColor: "#ef4444",
        title: "Your Order Has Been Cancelled",
        description:
          "Your order has been cancelled. Any reserved stock has been released back into inventory.",
        actionNote:
          order.notes
            ? `Cancellation note: ${order.notes}`
            : "If you have questions or believe this was an error, please contact our support team.",
      };
  }
}

export function generateNotificationEmail(
  order: NotificationOrderData,
  eventType: NotificationEventType
): { subject: string; html: string; text: string } {
  const content = getEventContent(eventType, order);

  const formattedTotal = `LKR ${order.total.toLocaleString("en-LK")}`;
  const formattedSubtotal = `LKR ${order.subtotal.toLocaleString("en-LK")}`;
  const formattedDelivery =
    order.deliveryFee > 0
      ? `LKR ${order.deliveryFee.toLocaleString("en-LK")}`
      : "FREE";

  const paymentLabel =
    order.paymentMethod === "cod"
      ? "Cash on Delivery"
      : order.paymentMethod === "bank"
      ? "Bank Transfer"
      : order.paymentMethod;

  const deliveryLabel =
    order.deliveryMethod === "delivery"
      ? "Islandwide Delivery"
      : "Store Pickup";

  // Item rows HTML
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px; font-weight: 500;">
          ${escapeHtml(item.productName)}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #f8fafc; font-size: 13px; text-align: right; font-weight: 600;">
          LKR ${(item.productPrice * item.quantity).toLocaleString("en-LK")}
        </td>
      </tr>`
    )
    .join("");

  // Complete HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #05080e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #05080e; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #090e17; border: 1px solid #1e293b; border-collapse: collapse; text-align: left;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #0f172a 0%, #090e17 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 16px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #ea580c;">PRIMEZORA</span>
                    <span style="display: block; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: #64748b; margin-top: 3px;">High Performance Computing</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 5px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 9999px; background-color: ${content.badgeColor}22; color: ${content.badgeColor}; border: 1px solid ${content.badgeColor}55;">
                      ${escapeHtml(content.badge)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Message -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em;">
                ${escapeHtml(content.title)}
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Hello <strong>${escapeHtml(order.customerName)}</strong>, ${content.description}
              </p>
              <div style="background-color: #0f172a; border-left: 3px solid #ea580c; padding: 14px 16px; font-size: 13px; line-height: 1.5; color: #cbd5e1;">
                ${escapeHtml(content.actionNote)}
              </div>
            </td>
          </tr>

          <!-- Order Summary Meta -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c121d; border: 1px solid #1e293b; padding: 16px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px 12px;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Order Number</span>
                    <span style="display: block; font-size: 14px; font-weight: 700; color: #ea580c; margin-top: 3px; font-family: monospace;">${escapeHtml(order.orderNumber)}</span>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px 12px;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Payment Method</span>
                    <span style="display: block; font-size: 13px; font-weight: 600; color: #f8fafc; margin-top: 3px;">${escapeHtml(paymentLabel)}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px 12px;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Delivery Option</span>
                    <span style="display: block; font-size: 13px; font-weight: 600; color: #f8fafc; margin-top: 3px;">${escapeHtml(deliveryLabel)}</span>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px 12px;">
                    <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Shipping To</span>
                    <span style="display: block; font-size: 12px; color: #cbd5e1; margin-top: 3px;">
                      ${escapeHtml(order.city || "Sri Lanka")}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #334155; text-align: left;">
                    <th style="padding-bottom: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b;">Item</th>
                    <th style="padding-bottom: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                <tr>
                  <td align="right" style="padding: 4px 0; font-size: 12px; color: #94a3b8;">Subtotal:</td>
                  <td width="120" align="right" style="padding: 4px 0; font-size: 12px; color: #f8fafc; font-weight: 600;">${formattedSubtotal}</td>
                </tr>
                <tr>
                  <td align="right" style="padding: 4px 0; font-size: 12px; color: #94a3b8;">Delivery Fee:</td>
                  <td width="120" align="right" style="padding: 4px 0; font-size: 12px; color: #f8fafc; font-weight: 600;">${formattedDelivery}</td>
                </tr>
                <tr>
                  <td align="right" style="padding: 10px 0 0 0; font-size: 14px; font-weight: 700; color: #f8fafc; text-transform: uppercase;">Total:</td>
                  <td width="120" align="right" style="padding: 10px 0 0 0; font-size: 16px; font-weight: 800; color: #ea580c;">${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #1e293b; background-color: #060a10; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                Primezora Technologies — Premier Gaming & Custom PC Hardware in Sri Lanka
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Need help? Email <a href="mailto:support@primezora.com" style="color: #ea580c; text-decoration: none;">support@primezora.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-Text Fallback
  const textItems = order.items
    .map(
      (item) =>
        `- ${item.productName} x ${item.quantity}: LKR ${(
          item.productPrice * item.quantity
        ).toLocaleString("en-LK")}`
    )
    .join("\n");

  const text = `
============================================================
PRIMEZORA TECHNOLOGIES
${content.title}
============================================================

Hello ${order.customerName},

${content.description}

${content.actionNote}

ORDER DETAILS:
------------------------------------------------------------
Order Number:    ${order.orderNumber}
Payment Method:  ${paymentLabel}
Delivery Method: ${deliveryLabel}
Delivery To:     ${order.city || "Sri Lanka"}

ITEMS:
${textItems}

------------------------------------------------------------
Subtotal:        ${formattedSubtotal}
Delivery Fee:    ${formattedDelivery}
TOTAL:           ${formattedTotal}
------------------------------------------------------------

If you have any questions, contact us at support@primezora.com.

Thank you for choosing Primezora Technologies!
`.trim();

  return {
    subject: content.subject,
    html,
    text,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
