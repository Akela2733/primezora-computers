import "server-only";

import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentMethod,
} from "@/lib/payment";
import {
  createPayHereCheckoutFields,
  verifyPayHereNotificationSignature as verifySignature,
} from "@/lib/payhere-core";

export type BankTransferDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
};

export function getWhatsAppBusinessNumber(): string {
  const value = requiredEnvironmentValue("WHATSAPP_BUSINESS_NUMBER")
    .replace(/[\s()+.-]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(value)) {
    throw new PaymentConfigurationError(
      "WHATSAPP_BUSINESS_NUMBER must be a valid international number with country code."
    );
  }
  return value;
}

export function getWhatsAppBusinessNumberForDisplay(): string | null {
  const configured = process.env.WHATSAPP_BUSINESS_NUMBER?.trim();
  if (!configured) return null;
  const value = configured.replace(/[\s()+.-]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(value)) {
    throw new PaymentConfigurationError(
      "WHATSAPP_BUSINESS_NUMBER must be a valid international number with country code."
    );
  }
  return value;
}

export class PaymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new PaymentConfigurationError(
      `Online payment is not configured. Set ${name} in the server environment.`
    );
  }
  return value;
}

export function getBankTransferDetails(): BankTransferDetails {
  return {
    bankName: requiredEnvironmentValue("BANK_TRANSFER_BANK_NAME"),
    accountName: requiredEnvironmentValue("BANK_TRANSFER_ACCOUNT_NAME"),
    accountNumber: requiredEnvironmentValue("BANK_TRANSFER_ACCOUNT_NUMBER"),
    branch: requiredEnvironmentValue("BANK_TRANSFER_BRANCH"),
  };
}

export function getBankTransferDetailsForDisplay(): BankTransferDetails | null {
  const values = [
    process.env.BANK_TRANSFER_BANK_NAME,
    process.env.BANK_TRANSFER_ACCOUNT_NAME,
    process.env.BANK_TRANSFER_ACCOUNT_NUMBER,
    process.env.BANK_TRANSFER_BRANCH,
  ].map((value) => value?.trim() ?? "");
  if (values.every((value) => !value)) return null;
  if (values.some((value) => !value)) {
    throw new PaymentConfigurationError(
      "Bank transfer details are only partially configured."
    );
  }
  return {
    bankName: values[0],
    accountName: values[1],
    accountNumber: values[2],
    branch: values[3],
  };
}

export function getPayHereConfiguration() {
  const merchantId = requiredEnvironmentValue("PAYHERE_MERCHANT_ID");
  const merchantSecret = requiredEnvironmentValue("PAYHERE_MERCHANT_SECRET");
  const siteUrl = requiredEnvironmentValue("PUBLIC_SITE_URL");
  const mode = process.env.PAYHERE_MODE?.trim().toLowerCase() || "sandbox";

  if (mode !== "sandbox" && mode !== "live") {
    throw new PaymentConfigurationError(
      "PAYHERE_MODE must be set to sandbox or live."
    );
  }

  let siteOrigin: string;
  try {
    const parsedUrl = new URL(siteUrl);
    if (
      (parsedUrl.protocol !== "https:" &&
        !(mode === "sandbox" && parsedUrl.hostname === "localhost")) ||
      parsedUrl.pathname !== "/" ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error("Invalid site origin.");
    }
    siteOrigin = parsedUrl.origin;
  } catch {
    throw new PaymentConfigurationError(
      "PUBLIC_SITE_URL must be a canonical HTTPS origin (localhost is allowed in sandbox)."
    );
  }

  return {
    merchantId,
    merchantSecret,
    siteOrigin,
    checkoutUrl:
      mode === "live"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout",
  };
}

export function createPayHereCheckout(input: PaymentIntentInput) {
  const config = getPayHereConfiguration();
  return {
    redirectUrl: config.checkoutUrl,
    fields: createPayHereCheckoutFields(config, input),
  };
}

export function createPayHerePaymentIntent(
  input: PaymentIntentInput
): PaymentIntentResult {
  const checkout = createPayHereCheckout(input);
  return {
    providerIntentId: `PAYHERE-${input.orderNumber}`,
    status: "requires_action",
    redirectUrl: checkout.redirectUrl,
    metadata: { checkoutFields: checkout.fields },
  };
}

export function verifyPayHereNotificationSignature(input: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
  signature: string;
}): boolean {
  const config = getPayHereConfiguration();
  return verifySignature(config, input);
}

export function assertPaymentMethodConfigured(method: PaymentMethod): void {
  if (method === "bank") {
    getBankTransferDetails();
    getWhatsAppBusinessNumber();
  }
  if (method === "card") {
    throw new PaymentConfigurationError(
      "Card payments are temporarily unavailable. Choose Cash on Delivery or Bank Transfer."
    );
  }
}
