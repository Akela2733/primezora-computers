import { NextResponse } from "next/server";

import { setCustomerSessionCookie } from "@/lib/customer-auth";
import { CustomerIdentityLinkError, resolveCustomerIdentity } from "@/lib/customer-identity";
import { prisma } from "@/lib/prisma";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import { supabaseExchangeCodeForSession } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id") || undefined;
  const error = url.searchParams.get("error");
  const next = getSafeCustomerRedirectPath(url.searchParams.get("next"));

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error === "access_denied" ? "oauth-callback-failed" : error)}&next=${encodeURIComponent(next)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth-callback-failed&next=${encodeURIComponent(next)}`, request.url)
    );
  }

  const signInResult = await supabaseExchangeCodeForSession(code, flowId);
  if (!signInResult.success || !signInResult.user) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth-callback-failed&next=${encodeURIComponent(next)}`, request.url)
    );
  }

  const email = (signInResult.user.email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.redirect(
      new URL(`/login?error=missing-email&next=${encodeURIComponent(next)}`, request.url)
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

    await setCustomerSessionCookie(customer.id, signInResult.user.id, customer.email);

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    if (error instanceof CustomerIdentityLinkError) {
      return NextResponse.redirect(
        new URL(`/login?error=account-link-required&next=${encodeURIComponent(next)}`, request.url)
      );
    }

    console.error("CUSTOMER_SOCIAL_AUTH_ERROR:", error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth-callback-failed&next=${encodeURIComponent(next)}`, request.url)
    );
  }
}
