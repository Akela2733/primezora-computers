import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentIntentInput } from "@/lib/payment";

export type PayHereConfiguration = {
  merchantId: string;
  merchantSecret: string;
  siteOrigin: string;
  checkoutUrl: string;
};

function md5(value: string): string {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}

export function createPayHereCheckoutFields(
  config: PayHereConfiguration,
  input: PaymentIntentInput
): Record<string, string> {
  const amount = input.amount.toFixed(2);
  const currency = "LKR";
  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    return_url: `${config.siteOrigin}/order-success?order=${encodeURIComponent(input.orderNumber)}`,
    cancel_url: `${config.siteOrigin}/payment/cancel?order=${encodeURIComponent(input.orderNumber)}`,
    notify_url: `${config.siteOrigin}/api/payments/payhere/notify`,
    order_id: input.orderNumber,
    items: input.orderNumber,
    currency,
    amount,
    first_name: input.customer.name.split(/\s+/)[0] || "Customer",
    last_name: input.customer.name.split(/\s+/).slice(1).join(" ") || " ",
    email: input.customer.email || "",
    phone: input.customer.phone || "",
    address: input.customer.address || "",
    city: input.customer.city || "",
    country: "Sri Lanka",
  };

  fields.hash = md5(
    `${config.merchantId}${input.orderNumber}${amount}${currency}${md5(config.merchantSecret)}`
  );
  return fields;
}

export function verifyPayHereNotificationSignature(
  config: Pick<PayHereConfiguration, "merchantId" | "merchantSecret">,
  input: {
    merchantId: string;
    orderId: string;
    amount: string;
    currency: string;
    statusCode: string;
    signature: string;
  }
): boolean {
  if (input.merchantId !== config.merchantId) return false;

  const expected = md5(
    `${input.merchantId}${input.orderId}${input.amount}${input.currency}${input.statusCode}${md5(config.merchantSecret)}`
  );
  const received = input.signature.trim().toUpperCase();
  if (!/^[A-F0-9]{32}$/.test(received)) return false;
  return timingSafeEqual(
    Buffer.from(received, "hex"),
    Buffer.from(expected, "hex")
  );
}
