import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { issueCustomerEmailConfirmation } from "@/lib/email-confirmation";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import {
  enforceRateLimits,
  getClientIp,
  getEmailRateLimitIdentifier,
} from "@/lib/rate-limit";

const genericNotice =
  "Request received. If an unverified account matches this address, a verification link will be sent when delivery is available.";

export async function POST(request: Request) {
  const emailIdentifier = await getEmailRateLimitIdentifier(request);
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "customerEmailConfirmationIp", identifier: getClientIp(request) },
    ...(emailIdentifier
      ? [
          {
            policy: "customerEmailConfirmationAccount" as const,
            identifier: emailIdentifier,
          },
        ]
      : []),
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const fields =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const email = typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  const nextPath = getSafeCustomerRedirectPath(fields.next);

  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

    if (!customer || customer.emailVerified) {
      return NextResponse.json(
        { success: true, sent: false, message: genericNotice },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await issueCustomerEmailConfirmation({
      ...customer,
      nextPath,
    });
    if (!result.success) {
      const cooldown = result.retryAfterSeconds;
      return NextResponse.json(
        {
          error: cooldown
            ? `We couldn't send another verification email right now. Please wait ${cooldown} seconds and try again.`
            : "We could not send the verification email. Please try again later.",
        },
        {
          status: cooldown ? 429 : 503,
          headers: {
            "Cache-Control": "no-store",
            ...(cooldown ? { "Retry-After": String(cooldown) } : {}),
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sent: true,
        message: "Verification email sent. Check your inbox and spam folder.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER_EMAIL_VERIFICATION_RESEND_ERROR:", error);
    return NextResponse.json(
      { error: "We could not process your request. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
