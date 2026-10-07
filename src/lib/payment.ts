/**
 * @file src/lib/payment.ts
 *
 * Payment Abstraction Layer — Primezora Technologies
 *
 * This module is the single source of truth for all payment-related logic,
 * constants, interfaces, and providers.
 *
 * Current supported payment methods:
 *   - "cod"  : Cash on Delivery (offline settlement upon delivery)
 *   - "bank" : Bank Transfer (offline direct bank deposit / slip verification)
 *
 * Architecture Design:
 *   Future third-party gateways can implement `PaymentProvider` and register
 *   with `PaymentProviderRegistry`. Order creation commits before provider work;
 *   online payments need separate payment idempotency and state coordination,
 *   ideally through an outbox-style workflow.
 */

// ============================================================================
// 1. CONSTANTS & CONFIGURATION
// ============================================================================

export const DELIVERY_FEE = 500; // Fixed delivery fee in LKR

export const SUPPORTED_PAYMENT_METHODS = ["cod", "bank"] as const;
export type PaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  shortDescription: string;
  instructions: string;
  isOnline: boolean;
  requiresClientRedirect: boolean;
}

export const PAYMENT_METHOD_CONFIGS: Record<PaymentMethod, PaymentMethodConfig> = {
  cod: {
    id: "cod",
    name: "Cash on Delivery",
    shortDescription: "Pay in cash when your order is delivered to your doorstep.",
    instructions: "Please prepare exact change in LKR upon delivery.",
    isOnline: false,
    requiresClientRedirect: false,
  },
  bank: {
    id: "bank",
    name: "Bank Transfer",
    shortDescription: "Direct deposit / bank transfer to our official bank account.",
    instructions:
      "Transfer the order total to our bank account. Use your Order Number as the transfer reference and send proof of payment.",
    isOnline: false,
    requiresClientRedirect: false,
  },
};

// ============================================================================
// 2. VALIDATION HELPERS
// ============================================================================

/**
 * Type guard to validate whether an unknown value is a supported payment method.
 */
export function isSupportedPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (SUPPORTED_PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

/**
 * Returns the human-readable label for a payment method.
 */
export function getPaymentMethodLabel(method: string): string {
  if (isSupportedPaymentMethod(method)) {
    return PAYMENT_METHOD_CONFIGS[method].name;
  }
  return method;
}

/**
 * Returns configuration details for a payment method.
 */
export function getPaymentMethodConfig(method: string): PaymentMethodConfig | null {
  if (isSupportedPaymentMethod(method)) {
    return PAYMENT_METHOD_CONFIGS[method];
  }
  return null;
}

// ============================================================================
// 3. PAYMENT ABSTRACTION INTERFACES (Future-Ready Architecture)
// ============================================================================

export type PaymentStatus =
  | "PENDING"      // Awaiting payment initiation or offline fulfillment
  | "PROCESSING"   // Payment intent created / in process
  | "PAID"         // Confirmed and verified on the server
  | "FAILED"       // Payment attempt declined or failed
  | "REFUNDED"     // Fully refunded
  | "CANCELLED";   // Cancelled before completion

export interface PaymentIntentInput {
  orderId: string;
  orderNumber: string;
  amount: number;       // in LKR (integer)
  currency?: string;   // default "LKR"
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  providerIntentId: string;
  status: "pending" | "succeeded" | "requires_action" | "processing" | "failed";
  clientSecret?: string;
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerificationInput {
  orderId: string;
  orderNumber: string;
  expectedAmount: number;
  paymentIntentId?: string;
  verificationPayload?: Record<string, unknown>;
  signature?: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  amountPaid?: number;
  failureReason?: string;
  timestamp: string;
}

/**
 * Unified Payment Provider contract.
 * Any future payment gateway must implement this interface.
 */
export interface PaymentProvider {
  readonly id: PaymentMethod;
  readonly name: string;
  readonly isOnline: boolean;

  /**
   * Creates a payment intent or records an offline order payment request.
   */
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;

  /**
   * Server-side verification of payment authenticity.
   * CRITICAL SECURITY RULE:
   * Client-submitted "success" responses must NEVER be accepted without
   * verifying provider signatures or server-side webhook validation.
   */
  verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult>;
}

// ============================================================================
// 4. PROVIDER IMPLEMENTATIONS (COD & Bank Transfer)
// ============================================================================

class CodPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "cod";
  readonly name = PAYMENT_METHOD_CONFIGS.cod.name;
  readonly isOnline = false;

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      providerIntentId: `COD-${input.orderNumber}`,
      status: "pending",
      metadata: {
        method: "cod",
        currency: input.currency ?? "LKR",
        amountDue: input.amount,
        settlementMethod: "Cash on delivery by courier agent",
      },
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    // For COD, payment is fulfilled physically upon delivery.
    // The order initially remains PENDING until courier confirms collection.
    return {
      verified: true,
      paymentStatus: "PENDING",
      transactionId: `COD-${input.orderNumber}`,
      amountPaid: 0, // Uncollected until delivery
      timestamp: new Date().toISOString(),
    };
  }
}

class BankTransferPaymentProvider implements PaymentProvider {
  readonly id: PaymentMethod = "bank";
  readonly name = PAYMENT_METHOD_CONFIGS.bank.name;
  readonly isOnline = false;

  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      providerIntentId: `BANK-${input.orderNumber}`,
      status: "requires_action",
      metadata: {
        method: "bank",
        currency: input.currency ?? "LKR",
        amountDue: input.amount,
        reference: input.orderNumber,
        instructions: PAYMENT_METHOD_CONFIGS.bank.instructions,
      },
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    // For Bank Transfer, admin must verify deposit slip before marking as confirmed/paid.
    return {
      verified: true,
      paymentStatus: "PENDING",
      transactionId: `BANK-${input.orderNumber}`,
      amountPaid: 0, // Pending bank verification
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// 5. PROVIDER REGISTRY & FACTORY
// ============================================================================

const providerRegistry = new Map<PaymentMethod, PaymentProvider>([
  ["cod", new CodPaymentProvider()],
  ["bank", new BankTransferPaymentProvider()],
]);

/**
 * Retrieve the payment provider for the given payment method.
 */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  const provider = providerRegistry.get(method);
  if (!provider) {
    throw new Error(`Unsupported payment provider: ${method}`);
  }
  return provider;
}

// ============================================================================
// 6. SECURITY & ANTI-TAMPERING GUARDS
// ============================================================================

/**
 * Validates that an order cannot be falsely marked as PAID from the client.
 * Enforces rule: Server-side validation must govern all payment status transitions.
 */
export function assertValidPaymentMethodTransition(
  currentStatus: string,
  newPaymentStatus: PaymentStatus,
  isServerVerified: boolean
): void {
  if (newPaymentStatus === "PAID" && !isServerVerified) {
    throw new Error(
      "Security violation: Order cannot be marked as PAID without cryptographically verified server confirmation."
    );
  }
}
