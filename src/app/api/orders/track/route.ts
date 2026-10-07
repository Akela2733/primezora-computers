import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { INPUT_LIMITS } from "@/lib/input-limits";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "orderTrackingIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Enter your order number and checkout email." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "Enter your order number and checkout email." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const input = body as Record<string, unknown>;
  const rawOrderNumber =
    typeof input.orderNumber === "string" ? input.orderNumber : "";
  const rawEmail = typeof input.email === "string" ? input.email : "";
  const orderNumber = rawOrderNumber.trim().toUpperCase();
  const email = rawEmail.trim().toLowerCase();

  if (
    !orderNumber ||
    rawOrderNumber.length > INPUT_LIMITS.orderTracking.orderNumber ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    rawEmail.length > INPUT_LIMITS.customer.email
  ) {
    return NextResponse.json(
      { error: "Enter a valid order number and checkout email." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customerEmail: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        deliveryMethod: true,
        paymentMethod: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        items: {
          select: {
            id: true,
            productName: true,
            productPrice: true,
            quantity: true,
          },
        },
        statusHistory: {
          select: {
            fromStatus: true,
            toStatus: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find an order matching those details." },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          statusHistory: order.statusHistory.map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString(),
          })),
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("ORDER TRACKING LOOKUP ERROR:", error);
    return NextResponse.json(
      { error: "Order tracking is temporarily unavailable." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
