import { NextResponse } from "next/server";
import { verifyCustomerEmailConfirmation } from "@/lib/email-confirmation";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimits(request, [
    {
      policy: "customerEmailVerificationIp",
      identifier: getClientIp(request),
    },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid", message: "Verification link is incomplete." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rawToken =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).token
      : undefined;
  if (typeof rawToken !== "string") {
    return NextResponse.json(
      { status: "invalid", message: "Verification link is incomplete." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  let result: Awaited<ReturnType<typeof verifyCustomerEmailConfirmation>>;
  try {
    result = await verifyCustomerEmailConfirmation(rawToken);
  } catch {
    console.error("CUSTOMER_EMAIL_VERIFICATION_ERROR");
    return NextResponse.json(
      {
        status: "unavailable",
        message: "We could not verify this link right now. Please try again later.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  const messages = {
    verified: "Your email is verified. You can now sign in.",
    already_verified: "This email address has already been verified. You can sign in.",
    already_used: "This verification link has already been used. You can sign in.",
    expired: "This verification link has expired. Request a new link to continue.",
    superseded: "This link was replaced by a newer verification email. Use the latest link or request another.",
    invalid: "This verification link is invalid. Request a new link to continue.",
  } as const;
  const statusCode =
    result === "expired"
      ? 410
      : result === "superseded" || result === "already_used"
        ? 409
        : result === "invalid"
          ? 400
          : 200;

  return NextResponse.json(
    { status: result, message: messages[result] },
    { status: statusCode, headers: { "Cache-Control": "no-store" } }
  );
}
