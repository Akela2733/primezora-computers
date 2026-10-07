import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import {
  OrderRequestError,
  parseCheckoutInput,
  type CheckoutInput,
} from "@/lib/checkout-validation";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { prisma } from "@/lib/prisma";
import {
  DELIVERY_FEE,
  getPaymentProvider,
  type PaymentMethod,
  type PaymentIntentResult,
} from "@/lib/payment";
import { sendOrderNotification } from "@/lib/notifications";
import { requireCustomerApiWithProfileCheck } from "@/lib/customer-auth";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";

const MAX_DATABASE_INT = INPUT_LIMITS.checkout.databaseInteger;

type CheckoutOrderResponse = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryMethod: string;
  address: string | null;
  city: string | null;
  province: string | null;
  subtotal: number;
  deliveryFee: number;
  items: {
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
  }[];
};

const ORDER_RESPONSE_SELECT = {
  id: true,
  orderNumber: true,
  total: true,
  status: true,
  paymentMethod: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  deliveryMethod: true,
  address: true,
  city: true,
  province: true,
  subtotal: true,
  deliveryFee: true,
  items: {
    select: {
      productId: true,
      productName: true,
      productPrice: true,
      quantity: true,
    },
  },
} as const;

const IDEMPOTENCY_RECORD_SELECT = {
  requestFingerprint: true,
  order: {
    select: ORDER_RESPONSE_SELECT,
  },
} as const;

class OrderConflictError extends Error {}

function readIdempotencyKey(request: Request): string {
  const key = request.headers.get("Idempotency-Key");
  if (
    !key ||
    key.length < 16 ||
    key.length > 128 ||
    !/^[A-Za-z0-9][A-Za-z0-9._~-]{15,127}$/.test(key)
  ) {
    throw new OrderRequestError(
      "A valid Idempotency-Key header is required."
    );
  }

  return key;
}

function fingerprintCheckoutInput(input: CheckoutInput): string {
  const canonicalInput = {
    version: 1,
    customer: input.customer,
    items: [...input.items].sort((left, right) =>
      left.productId.localeCompare(right.productId)
    ),
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalInput))
    .digest("hex");
}

function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function createPaymentIntent(
  order: CheckoutOrderResponse,
  paymentMethod: PaymentMethod
): Promise<PaymentIntentResult> {
  const provider = getPaymentProvider(paymentMethod);
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

function respondWithOrder(
  order: CheckoutOrderResponse,
  paymentIntent: PaymentIntentResult
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        // Replays keep the creation-time status even after later admin updates.
        status: "PENDING",
        paymentMethod: order.paymentMethod,
      },
      payment: {
        providerIntentId: paymentIntent.providerIntentId,
        status: paymentIntent.status,
        instructions:
          typeof paymentIntent.metadata?.instructions === "string"
            ? paymentIntent.metadata.instructions
            : null,
      },
    },
    { status: 201 }
  );
}

async function respondWithIdempotentOrder(
  customerId: string,
  key: string,
  requestFingerprint: string,
  paymentMethod: PaymentMethod
): Promise<NextResponse | null> {
  const existing = await prisma.checkoutIdempotency.findUnique({
    where: {
      customerId_key: { customerId, key },
    },
    select: IDEMPOTENCY_RECORD_SELECT,
  });

  if (!existing) return null;
  if (existing.requestFingerprint !== requestFingerprint) {
    return NextResponse.json(
      { error: "This Idempotency-Key was already used for a different checkout request." },
      { status: 409 }
    );
  }

  const paymentIntent = await createPaymentIntent(existing.order, paymentMethod);
  return respondWithOrder(existing.order, paymentIntent);
}

export async function POST(request: Request) {
  const ipRateLimitResponse = await enforceRateLimits(request, [
    { policy: "checkoutIp", identifier: getClientIp(request) },
  ]);
  if (ipRateLimitResponse) return ipRateLimitResponse;

  const authResult = await requireCustomerApiWithProfileCheck();
  if (authResult.response) {
    return authResult.response;
  }

  const authenticatedCustomer = authResult.session.customer;
  const rateLimitResponse = await enforceRateLimits(request, [
    {
      policy: "checkoutCustomer",
      identifier: `customer:${authenticatedCustomer.id}`,
    },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const idempotencyKey = readIdempotencyKey(request);
    let input: CheckoutInput;
    try {
      input = parseCheckoutInput(await request.json());
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new OrderRequestError("Invalid JSON in order request.");
      }
      throw error;
    }

    const requestFingerprint = fingerprintCheckoutInput(input);
    const existingResponse = await respondWithIdempotentOrder(
      authenticatedCustomer.id,
      idempotencyKey,
      requestFingerprint,
      input.paymentMethod
    );
    if (existingResponse) return existingResponse;

    const orderNumber = `PRZ-${randomUUID().toUpperCase()}`;
    const orderCustomerName =
      `${input.customer.firstName} ${input.customer.lastName}`.trim() ||
      [
        authenticatedCustomer.firstName,
        authenticatedCustomer.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      authenticatedCustomer.name ||
      authenticatedCustomer.email;
    const orderCustomerEmail =
      input.customer.email?.trim().toLowerCase() ||
      authenticatedCustomer.email;
    const orderCustomerPhone =
      input.customer.phone || authenticatedCustomer.phone || "";

    let order: CheckoutOrderResponse | undefined;
    for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
      try {
        order = await prisma.$transaction(
          async (tx) => {
            const productIds = input.items.map((item) => item.productId);

            const products = await tx.product.findMany({
              where: {
                id: {
                  in: productIds,
                },
              },
            });

            if (products.length !== input.items.length) {
              throw new OrderRequestError(
                "One or more products could not be found."
              );
            }

            const productsById = new Map(
              products.map((product) => [product.id, product])
            );
            const orderItems: {
              productId: string;
              productName: string;
              productPrice: number;
              quantity: number;
            }[] = [];
            let subtotal = 0;

            for (const item of input.items) {
              const product = productsById.get(item.productId);
              if (!product) {
                throw new OrderRequestError(
                  "One or more products could not be found."
                );
              }

              if (!product.inStock || product.stockQuantity < item.quantity) {
                throw new OrderConflictError(
                  "One or more products no longer have the requested stock."
                );
              }

              if (!Number.isSafeInteger(product.price) || product.price < 0) {
                throw new OrderConflictError(
                  "A product has invalid pricing. Please contact support."
                );
              }

              const itemTotal = product.price * item.quantity;
              if (
                !Number.isSafeInteger(itemTotal) ||
                itemTotal > MAX_DATABASE_INT ||
                subtotal + itemTotal > MAX_DATABASE_INT
              ) {
                throw new OrderRequestError(
                  "Order amount exceeds the supported limit.",
                  422
                );
              }

              subtotal += itemTotal;
              orderItems.push({
                productId: product.id,
                productName: product.name,
                productPrice: product.price,
                quantity: item.quantity,
              });
            }

            const deliveryFee =
              input.deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
            const total = subtotal + deliveryFee;
            if (!Number.isSafeInteger(total) || total > MAX_DATABASE_INT) {
              throw new OrderRequestError(
                "Order amount exceeds the supported limit.",
                422
              );
            }

            const customerId = authenticatedCustomer.id;
            const customerName = orderCustomerName;
            const customerEmail = orderCustomerEmail;
            const customerPhone = orderCustomerPhone;
            for (const item of orderItems) {
              const reservation = await tx.product.updateMany({
                where: {
                  id: item.productId,
                  inStock: true,
                  stockQuantity: {
                    gte: item.quantity,
                  },
                },
                data: {
                  stockQuantity: {
                    decrement: item.quantity,
                  },
                },
              });

              if (reservation.count !== 1) {
                throw new OrderConflictError(
                  "One or more products no longer have the requested stock."
                );
              }

              await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stockQuantity: 0,
                },
                data: {
                  inStock: false,
                },
              });
            }

            const createdOrder = await tx.order.create({
              data: {
                orderNumber,
                customerId,
                customerName,
                customerEmail,
                customerPhone,
                deliveryMethod: input.deliveryMethod,
                address:
                  input.deliveryMethod === "delivery"
                    ? input.customer.address
                    : null,
                city:
                  input.deliveryMethod === "delivery"
                    ? input.customer.city
                    : null,
                province:
                  input.deliveryMethod === "delivery"
                    ? input.customer.district
                    : null,
                postalCode:
                  input.deliveryMethod === "delivery"
                    ? input.customer.postalCode || null
                    : null,
                subtotal,
                deliveryFee,
                total,
                paymentMethod: input.paymentMethod,
                status: "PENDING",
                items: {
                  create: orderItems,
                },
              },
              select: ORDER_RESPONSE_SELECT,
            });

            await tx.checkoutIdempotency.create({
              data: {
                customerId,
                key: idempotencyKey,
                requestFingerprint,
                orderId: createdOrder.id,
              },
            });

            return createdOrder;
          },
          {
            isolationLevel: "Serializable",
            maxWait: 5_000,
            timeout: 10_000,
          }
        );
      } catch (error) {
        if (
          isPrismaErrorCode(error, "P2002") ||
          isPrismaErrorCode(error, "P2034") ||
          error instanceof OrderConflictError
        ) {
          const concurrentResponse = await respondWithIdempotentOrder(
            authenticatedCustomer.id,
            idempotencyKey,
            requestFingerprint,
            input.paymentMethod
          );
          if (concurrentResponse) return concurrentResponse;
        }

        if (isPrismaErrorCode(error, "P2034") && attempt < 2) {
          await new Promise((resolveRetry) =>
            setTimeout(resolveRetry, 20 * (attempt + 1))
          );
          continue;
        }
        throw error;
      }
    }
    if (!order) throw new Error("The checkout transaction did not return an order.");

    // Keep payment work outside the transaction; online providers need separate
    // payment idempotency and order/payment state coordination.
    const paymentIntent = await createPaymentIntent(order, input.paymentMethod);

    // Trigger Order Placed Notification (non-blocking for order creation)
    if (order.customerName && order.customerEmail) {
      await sendOrderNotification({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone ?? "",
          deliveryMethod: order.deliveryMethod,
          address: order.address ?? "",
          city: order.city ?? "",
          province: order.province ?? "",
          paymentMethod: order.paymentMethod,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          items: order.items,
          status: order.status,
        },
        eventType: "ORDER_PLACED",
      });
    }

    return respondWithOrder(order, paymentIntent);
  } catch (error) {
    if (error instanceof OrderRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof OrderConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      if (error.code === "P2034") {
        return NextResponse.json(
          {
            error:
              "Inventory changed while placing your order. Please retry checkout.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: "The order could not be finalized. Please retry checkout.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "A product changed during checkout. Please review your cart and retry.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2024" || error.code === "P2028") {
        return NextResponse.json(
          {
            error:
              "Order processing is temporarily busy. Please retry checkout.",
          },
          { status: 503 }
        );
      }
    }

    console.error("CREATE ORDER ERROR:", error);
    return NextResponse.json(
      {
        error: "Unable to create your order. Please try again.",
      },
      { status: 500 }
    );
  }
}