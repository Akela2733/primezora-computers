import { NextResponse } from "next/server";
import {
  verifyAndProcessOrderPayment,
  PaymentProcessingError,
} from "@/lib/payment-server";
import { triggerOrderNotificationById } from "@/lib/notifications";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { requireCustomerApi } from "@/lib/customer-auth";

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "paymentVerificationIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  const { session, response } = await requireCustomerApi();
  if (response) return response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid payment verification request." },
        { status: 400 }
      );
    }

    const {
      orderId,
      paymentIntentId,
      verificationPayload,
      signature,
    } = body as {
      orderId?: unknown;
      paymentIntentId?: unknown;
      verificationPayload?: unknown;
      signature?: unknown;
    };

    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json(
        { error: "orderId is required." },
        { status: 400 }
      );
    }

    const result = await verifyAndProcessOrderPayment({
      orderId: orderId.trim(),
      customerId: session!.customer.id,
      paymentIntentId:
        typeof paymentIntentId === "string" ? paymentIntentId.trim() : undefined,
      verificationPayload:
        typeof verificationPayload === "object" &&
        verificationPayload !== null &&
        !Array.isArray(verificationPayload)
          ? (verificationPayload as Record<string, unknown>)
          : undefined,
      signature: typeof signature === "string" ? signature.trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.failureReason || "Payment could not be verified.",
          orderId: result.orderId,
        },
        { status: 400 }
      );
    }

    // Trigger notification if newly confirmed
    if (result.currentStatus === "CONFIRMED" && !result.alreadyProcessed) {
      triggerOrderNotificationById(result.orderId, "ORDER_CONFIRMED").catch((err) => {
        console.error("Failed to trigger CONFIRMED notification in payment verification:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        status: result.currentStatus,
        alreadyProcessed: result.alreadyProcessed,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PaymentProcessingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("PAYMENT VERIFICATION API ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error while verifying payment." },
      { status: 500 }
    );
  }
}
