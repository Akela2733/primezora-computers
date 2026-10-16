import { NextResponse } from "next/server";

import {
  buildCustomerPasswordResetUrl,
  getCustomerPasswordRecoveryConfigurationError,
  sendCustomerPasswordRecoveryEmail,
} from "@/lib/customer-password-recovery";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import {
  enforceRateLimits,
  getClientIp,
  getEmailRateLimitIdentifier,
} from "@/lib/rate-limit";
import { getEmailProvider } from "@/lib/notifications/providers";
import {
  generateCustomerPasswordRecoveryToken,
  getSupabaseAuthConfig,
} from "@/lib/supabase-auth";

const recoveryNotice =
  "If an account matches and email delivery is available, a password reset link will arrive shortly.";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const emailIdentifier = await getEmailRateLimitIdentifier(request);
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "customerPasswordRecoveryIp", identifier: getClientIp(request) },
    ...(emailIdentifier
      ? [
          {
            policy: "customerPasswordRecoveryAccount" as const,
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
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  const fields =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const email =
    typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Please provide a valid email address." }, 400);
  }
  const nextPath = getSafeCustomerRedirectPath(fields.next);

  const provider = getEmailProvider();
  const configurationError =
    getCustomerPasswordRecoveryConfigurationError(provider);
  const supabaseConfig = getSupabaseAuthConfig();
  if (
    configurationError ||
    !supabaseConfig.isConfigured ||
    !supabaseConfig.serviceRoleKey
  ) {
    console.error("CUSTOMER_PASSWORD_RECOVERY_CONFIGURATION_INVALID:", {
      emailProvider: configurationError,
      supabaseConfigured: supabaseConfig.isConfigured,
      supabaseAdminConfigured: Boolean(supabaseConfig.serviceRoleKey),
    });
    return jsonResponse(
      { error: "Password recovery is temporarily unavailable. Please try again later." },
      503
    );
  }

  try {
    const { tokenHash } = await generateCustomerPasswordRecoveryToken(email);
    if (tokenHash) {
      await sendCustomerPasswordRecoveryEmail(
        email,
        buildCustomerPasswordResetUrl(tokenHash, nextPath),
        provider
      );
    }
  } catch (error) {
    console.error("CUSTOMER_PASSWORD_RECOVERY_REQUEST_ERROR:", error);
  }

  return jsonResponse({ success: true, message: recoveryNotice });
}
