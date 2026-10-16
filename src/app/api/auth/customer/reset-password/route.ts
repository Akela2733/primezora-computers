import { NextResponse } from "next/server";

import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { completeCustomerPasswordRecovery } from "@/lib/supabase-auth";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "customerPasswordResetIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  const fields =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const tokenHash =
    typeof fields.tokenHash === "string" ? fields.tokenHash.trim() : "";
  const password = typeof fields.password === "string" ? fields.password : "";

  if (
    tokenHash.length < 20 ||
    tokenHash.length > 512 ||
    !/^[A-Za-z0-9_-]+$/.test(tokenHash)
  ) {
    return jsonResponse(
      { error: "This password reset link is invalid or has expired. Request a new one to continue." },
      400
    );
  }
  if (password.length < 8 || password.length > 128) {
    return jsonResponse(
      { error: "Your new password must be between 8 and 128 characters." },
      400
    );
  }

  try {
    const result = await completeCustomerPasswordRecovery(tokenHash, password);
    if (!result.success) {
      return jsonResponse(
        { error: "This password reset link is invalid or has expired. Request a new one to continue." },
        400
      );
    }
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("CUSTOMER_PASSWORD_RECOVERY_COMPLETION_ERROR:", error);
    return jsonResponse(
      { error: "We could not reset your password right now. Please try again later." },
      503
    );
  }
}
