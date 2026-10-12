import { NextResponse } from "next/server";

import {
  createCustomerSessionToken,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
} from "@/lib/customer-session";
import { CustomerIdentityLinkError, resolveCustomerIdentity } from "@/lib/customer-identity";
import { prisma } from "@/lib/prisma";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import {
  applyCustomerOAuthCookieChanges,
  supabaseExchangeCodeForSession,
} from "@/lib/supabase-auth";

function redirectToLogin(
  requestUrl: string,
  error: string,
  next: string,
  cookieChanges: Parameters<typeof applyCustomerOAuthCookieChanges>[1] = []
) {
  const response = NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`,
      requestUrl
    )
  );
  applyCustomerOAuthCookieChanges(response, cookieChanges);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id") || undefined;
  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const next = getSafeCustomerRedirectPath(url.searchParams.get("next"));

  if (error) {
    const loginError =
      errorCode === "flow_state_already_used"
        ? "oauth-flow-already-used"
        : error === "access_denied"
          ? "oauth-callback-failed"
          : error;
    console.error("CUSTOMER_OAUTH_PROVIDER_ERROR:", {
      error,
      errorCode,
      description: url.searchParams.get("error_description"),
    });

    return redirectToLogin(request.url, loginError, next);
  }

  if (!code) {
    console.error("CUSTOMER_OAUTH_CALLBACK_MISSING_CODE:", {
      hasFlowId: Boolean(flowId),
    });
    return redirectToLogin(request.url, "oauth-callback-failed", next);
  }

  const cookieNames = new Set(
    (request.headers.get("cookie") ?? "")
      .split(";")
      .map((cookie) => cookie.trim().split("=", 1)[0])
      .filter(Boolean)
  );
  console.info("CUSTOMER_OAUTH_CALLBACK_COOKIE_STATE:", {
    hasFlowId: Boolean(flowId),
    hasLegacyVerifier: cookieNames.has(
      "primezora-customer-oauth-code-verifier"
    ),
    hasFlowVerifier: flowId
      ? cookieNames.has(
          `primezora-customer-oauth-flow-${flowId}-code-verifier`
        )
      : false,
  });

  const signInResult = await supabaseExchangeCodeForSession(code, flowId);
  if (!signInResult.success || !signInResult.user) {
    console.error("CUSTOMER_OAUTH_EXCHANGE_FAILED:", signInResult.error);
    return redirectToLogin(
      request.url,
      "oauth-callback-failed",
      next,
      signInResult.cookieChanges
    );
  }

  const email = (signInResult.user.email || "").trim().toLowerCase();
  if (!email) {
    return redirectToLogin(
      request.url,
      "missing-email",
      next,
      signInResult.cookieChanges
    );
  }

  const metadata = signInResult.user.user_metadata || {};
  const firstName =
    typeof metadata.firstName === "string"
      ? metadata.firstName
      : typeof metadata.given_name === "string"
        ? metadata.given_name
        : "";
  const lastName =
    typeof metadata.lastName === "string"
      ? metadata.lastName
      : typeof metadata.family_name === "string"
        ? metadata.family_name
        : "";

  try {
    const customer = await resolveCustomerIdentity(
      prisma,
      {
        authUserId: signInResult.user.id,
        email,
        firstName,
        lastName,
      },
      { allowEmailLink: false }
    );

    const response = NextResponse.redirect(new URL(next, request.url));
    const token = await createCustomerSessionToken(
      customer.id,
      signInResult.user.id,
      customer.email
    );
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
    });
    applyCustomerOAuthCookieChanges(response, signInResult.cookieChanges ?? []);

    return response;
  } catch (error) {
    if (error instanceof CustomerIdentityLinkError) {
      return redirectToLogin(
        request.url,
        "account-link-required",
        next,
        signInResult.cookieChanges
      );
    }

    console.error("CUSTOMER_SOCIAL_AUTH_ERROR:", error);
    return redirectToLogin(
      request.url,
      "oauth-callback-failed",
      next,
      signInResult.cookieChanges
    );
  }
}
