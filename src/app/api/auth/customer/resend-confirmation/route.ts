import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { issueCustomerEmailConfirmation } from "@/lib/email-confirmation";
import { getEmailProvider } from "@/lib/notifications/providers";
import {
  enforceRateLimits,
  getClientIp,
  getEmailRateLimitIdentifier,
} from "@/lib/rate-limit";

const genericSuccessMessage =
  "If an unverified Primezora account is associated with that email, a new confirmation link has been sent.";

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

  const rawEmail =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).email
      : undefined;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (getEmailProvider().name === "console") {
    return NextResponse.json(
      { error: "Email delivery is temporarily unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

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

    if (customer && !customer.emailVerified) {
      const result = await issueCustomerEmailConfirmation(customer);
      if (!result.success) {
        console.error("CUSTOMER_EMAIL_CONFIRMATION_RESEND_FAILED");
        return NextResponse.json(
          { error: "We could not send the confirmation email. Please try again later." },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: genericSuccessMessage },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER_EMAIL_CONFIRMATION_RESEND_ERROR:", error);
    return NextResponse.json(
      { error: "We could not process your request. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
