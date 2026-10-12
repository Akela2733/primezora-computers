import { NextResponse } from "next/server";

import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import { supabaseSignInWithProvider } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Social sign-in requires a valid provider." },
      { status: 400 }
    );
  }

  const { provider, next } = body as Record<string, unknown>;
  const normalizedProvider = provider === "google" || provider === "facebook" ? provider : null;

  if (!normalizedProvider) {
    return NextResponse.json(
      { error: "Unsupported social login provider." },
      { status: 400 }
    );
  }

  const redirectPath = getSafeCustomerRedirectPath(next);
  const callbackUrl = new URL("/api/auth/customer/oauth/callback", new URL(request.url).origin);
  callbackUrl.searchParams.set("next", redirectPath);

  const result = await supabaseSignInWithProvider({
    provider: normalizedProvider,
    redirectTo: callbackUrl.toString(),
  });

  if (!result.success || !result.url) {
    return NextResponse.json(
      { error: result.error || "Social sign-in could not be started." },
      { status: 400 }
    );
  }

  return NextResponse.json({ url: result.url });
}
