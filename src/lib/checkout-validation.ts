import { isSupportedPaymentMethod, type PaymentMethod } from "@/lib/payment";
import { INPUT_LIMITS, exceedsTextLimit } from "@/lib/input-limits";

const MAX_DATABASE_INT = INPUT_LIMITS.checkout.databaseInteger;
const MAX_ORDER_LINES = INPUT_LIMITS.checkout.itemLines;

export type CheckoutInput = {
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    address: string;
    city: string;
    district: string;
    postalCode: string;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: PaymentMethod;
};

export class OrderRequestError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readText(
  value: unknown,
  field: string,
  maximum: number,
  required = false
): string {
  if (typeof value !== "string") {
    if (!required && value === undefined) return "";
    throw new OrderRequestError(`${field} must be text.`);
  }

  if (exceedsTextLimit(value, maximum)) {
    throw new OrderRequestError(
      `${field} cannot exceed ${maximum} characters.`
    );
  }

  const text = value.trim();
  if (required && !text) {
    throw new OrderRequestError(`${field} is required.`);
  }

  return text;
}

export function parseCheckoutInput(value: unknown): CheckoutInput {
  if (!isRecord(value)) {
    throw new OrderRequestError("Invalid order request.");
  }

  if (!isRecord(value.customer)) {
    throw new OrderRequestError("Customer information is required.");
  }

  const firstName = readText(
    value.customer.firstName,
    "First name",
    INPUT_LIMITS.customer.firstName,
    true
  );
  const lastName = readText(
    value.customer.lastName,
    "Last name",
    INPUT_LIMITS.customer.lastName,
    true
  );
  const phone = readText(
    value.customer.phone,
    "Phone number",
    INPUT_LIMITS.customer.phone,
    true
  );
  const emailText = readText(
    value.customer.email,
    "Email address",
    INPUT_LIMITS.customer.email
  );
  const email = emailText ? emailText.toLowerCase() : null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new OrderRequestError("Enter a valid email address.");
  }

  const deliveryMethod = value.deliveryMethod;
  if (deliveryMethod !== "delivery" && deliveryMethod !== "pickup") {
    throw new OrderRequestError("Invalid delivery method.");
  }

  const paymentMethod = value.paymentMethod;
  if (!isSupportedPaymentMethod(paymentMethod)) {
    throw new OrderRequestError("Invalid payment method.");
  }

  const address = readText(
    value.customer.address,
    "Address",
    INPUT_LIMITS.customer.address
  );
  const city = readText(
    value.customer.city,
    "City",
    INPUT_LIMITS.customer.city
  );
  const district = readText(
    value.customer.district,
    "District",
    INPUT_LIMITS.checkout.district
  );
  const postalCode = readText(
    value.customer.postalCode,
    "Postal code",
    INPUT_LIMITS.customer.postalCode
  );

  if (
    deliveryMethod === "delivery" &&
    (!address || !city || !district)
  ) {
    throw new OrderRequestError(
      "Complete the delivery address, city and district."
    );
  }

  if (!Array.isArray(value.items)) {
    throw new OrderRequestError("Invalid order items.");
  }
  if (value.items.length === 0) {
    throw new OrderRequestError("Your cart is empty.");
  }
  if (value.items.length > MAX_ORDER_LINES) {
    throw new OrderRequestError(
      `An order cannot contain more than ${MAX_ORDER_LINES} item lines.`
    );
  }

  const quantities = new Map<string, number>();
  for (const item of value.items) {
    if (!isRecord(item)) {
      throw new OrderRequestError("Invalid order item.");
    }

    const productId = readText(
      item.productId,
      "Product ID",
      INPUT_LIMITS.checkout.productId,
      true
    );

    if (
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > MAX_DATABASE_INT
    ) {
      throw new OrderRequestError(
        "Each item quantity must be a positive integer."
      );
    }

    const combinedQuantity =
      (quantities.get(productId) ?? 0) + item.quantity;
    if (combinedQuantity > MAX_DATABASE_INT) {
      throw new OrderRequestError("Item quantity is too large.");
    }
    quantities.set(productId, combinedQuantity);
  }

  return {
    customer: {
      firstName,
      lastName,
      phone,
      email,
      address,
      city,
      district,
      postalCode,
    },
    items: Array.from(quantities, ([productId, quantity]) => ({
      productId,
      quantity,
    })),
    deliveryMethod,
    paymentMethod,
  };
}
