import { NextResponse } from "next/server";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  CustomerIdentityLinkError,
  resolveCustomerIdentity,
} from "@/lib/customer-identity";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";

type CustomerLoginIdentity = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

type CustomerLoginDependencies = {
  db: PrismaClient;
  authenticate: (input: {
    email: string;
    password: string;
  }) => Promise<{
    success: boolean;
    user?: CustomerLoginIdentity;
    error?: string;
  }>;
  issueSession: (
    customerId: string,
    authUserId: string,
    email: string
  ) => Promise<void>;
};

export async function handleCustomerLogin(
  request: Request,
  dependencies: CustomerLoginDependencies
): Promise<NextResponse> {
  const { db, authenticate, issueSession } = dependencies;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const { email, password, next } = body as Record<string, unknown>;
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPassword = typeof password === "string" ? password : "";

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const signInResult = await authenticate({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (!signInResult.success || !signInResult.user) {
      return NextResponse.json(
        { error: signInResult.error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const authUserId = signInResult.user.id;
    const metadata = signInResult.user.user_metadata || {};
    const firstName =
      typeof metadata.firstName === "string" ? metadata.firstName : "";
    const lastName =
      typeof metadata.lastName === "string" ? metadata.lastName : "";

    const unverifiedCustomer = await db.customer.findFirst({
      where: {
        emailVerified: false,
        OR: [{ authUserId }, { email: cleanEmail }],
      },
      select: { email: true },
    });
    if (unverifiedCustomer) {
      const redirectUrl = `/verify-email?email=${encodeURIComponent(
        unverifiedCustomer.email
      )}&next=${encodeURIComponent(getSafeCustomerRedirectPath(next))}`;
      return NextResponse.json(
        {
          error: "Email verification is required before you can sign in.",
          requiresEmailConfirmation: true,
          verificationUrl: redirectUrl,
        },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const customer = await resolveCustomerIdentity(db, {
      authUserId,
      email: cleanEmail,
      firstName,
      lastName,
    });

    if (!customer.emailVerified) {
      return NextResponse.json(
        {
          error: "Email verification is required before you can sign in.",
          requiresEmailConfirmation: true,
          verificationUrl: `/verify-email?email=${encodeURIComponent(
            customer.email
          )}&next=${encodeURIComponent(getSafeCustomerRedirectPath(next))}`,
        },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    await issueSession(customer.id, authUserId, customer.email);

    return NextResponse.json({
      success: true,
      redirectUrl: getSafeCustomerRedirectPath(next),
    });
  } catch (error) {
    if (error instanceof CustomerIdentityLinkError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error("CUSTOMER_LOGIN_ERROR:", error);
    return NextResponse.json(
      { error: "Unable to sign in at this time. Please try again later." },
      { status: 500 }
    );
  }
}
