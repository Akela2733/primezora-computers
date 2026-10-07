import { NextRequest, NextResponse } from "next/server";

import { verifyAdminPassword } from "@/lib/admin-password";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { logger } from "@/lib/logger";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";

function getRedirectPath(value: unknown, request: NextRequest): string {
  if (typeof value !== "string" || value.length > 2048) return "/admin";

  try {
    const target = new URL(value, request.url);
    if (
      target.origin !== new URL(request.url).origin ||
      (target.pathname !== "/admin" && !target.pathname.startsWith("/admin/")) ||
      target.pathname === "/admin/login"
    ) {
      return "/admin";
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/admin";
  }
}

function getConfiguredCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();

  return { configuredEmail: email, passwordHash, sessionSecret };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || email.length > 254 || !password || password.length > 1024) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 400 }
    );
  }

  const { configuredEmail, passwordHash, sessionSecret } = getConfiguredCredentials();
  if (!configuredEmail || !passwordHash || !sessionSecret) {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 }
    );
  }

  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "adminLoginIp", identifier: getClientIp(request) },
    { policy: "adminLoginAccount", identifier: `email:${email.toLowerCase()}` },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const passwordMatches = await verifyAdminPassword(password, passwordHash);
    const emailMatches = email.toLowerCase() === configuredEmail;

    if (!passwordMatches || !emailMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken(configuredEmail);
    const response = NextResponse.json({
      success: true,
      redirectTo: getRedirectPath(input.next, request),
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      priority: "high",
    });

    return response;
  } catch (error) {
    logger.error("ADMIN LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Admin login is temporarily unavailable." },
      { status: 503 }
    );
  }
}