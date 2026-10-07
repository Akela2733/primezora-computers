import { NextRequest, NextResponse } from "next/server";
import { createAdminPasswordHash } from "@/lib/admin-password";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || password.length < 12 || password.length > 1024) {
    return NextResponse.json({ error: "Invalid email or password length." }, { status: 400 });
  }

  try {
    const hash = await createAdminPasswordHash(password);

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Admin credentials are managed by environment configuration in production." },
        { status: 403 }
      );
    }

    process.env.ADMIN_EMAIL = normalizedEmail;
    process.env.ADMIN_PASSWORD_HASH = hash;
    return NextResponse.json({ success: true, email: normalizedEmail });
  } catch (error) {
    logger.error("ADMIN REGISTER ERROR:", error);
    return NextResponse.json({ error: "Failed to generate hash." }, { status: 500 });
  }
}
