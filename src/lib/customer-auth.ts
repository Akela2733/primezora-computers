import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "@/lib/customer-session";
import type { Customer } from "@/generated/prisma/client";
import {
  resolveCustomerApiSession,
  resolveCustomerPageSession,
  resolveCustomerSession,
} from "@/lib/customer-session-authorization";

export { CustomerSessionUnavailableError } from "@/lib/customer-session-authorization";

export type AuthenticatedCustomer = {
  customer: Customer;
  authUserId: string | null;
  email: string;
};

type CustomerSessionResolver = () => Promise<AuthenticatedCustomer | null>;

/**
 * Retrieves the currently authenticated customer from the request cookie session and Prisma.
 * Verifies session cryptographic integrity and returns the Prisma Customer record.
 */
export async function getCustomerSession(): Promise<AuthenticatedCustomer | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const verified = await verifyCustomerSessionToken(token);
  if (!verified) return null;

  return resolveCustomerSession(verified, (customerId) =>
    prisma.customer.findUnique({ where: { id: customerId } })
  );
}

/**
 * Protects customer pages (like /account).
 * Redirects unauthenticated visitors to /login with the optional next return URL.
 */
export async function requireCustomerPage(
  nextPath?: string,
  resolveSession: CustomerSessionResolver = getCustomerSession
): Promise<AuthenticatedCustomer> {
  return resolveCustomerPageSession(resolveSession, () => {
    if (nextPath && nextPath.startsWith("/") && nextPath !== "/login" && nextPath !== "/register") {
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    }
    redirect("/login");
  });
}

/**
 * Protects customer API endpoints.
 * Returns a 401 NextResponse if unauthenticated, or null if the session is valid.
 */
export async function requireCustomerApi(
  resolveSession: CustomerSessionResolver = getCustomerSession
): Promise<{
  session: AuthenticatedCustomer | null;
  response: NextResponse | null;
}> {
  return resolveCustomerApiSession(resolveSession);
}

export type CustomerApiAuthResult =
  | { session: AuthenticatedCustomer; response: null }
  | { session: null; response: NextResponse };

/**
 * Protects customer API endpoints with strict unauthenticated (401) vs profile missing (404) checks.
 */
export async function requireCustomerApiWithProfileCheck(): Promise<CustomerApiAuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Authentication required. Please sign in to continue." },
        { status: 401 }
      ),
    };
  }

  const verified = await verifyCustomerSessionToken(token);
  if (!verified) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Session expired or invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  let customer: Customer | null;
  try {
    customer = await prisma.customer.findUnique({
      where: { id: verified.customerId },
    });
  } catch {
    console.error("CUSTOMER_AUTH_LOOKUP_UNAVAILABLE");
    return {
      session: null,
      response: NextResponse.json(
        { error: "Authentication service temporarily unavailable." },
        { status: 503 }
      ),
    };
  }

  if (!customer) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Customer profile not found. Please log in or complete your profile." },
        { status: 404 }
      ),
    };
  }

  if (!verified.authUserId || customer.authUserId !== verified.authUserId) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Session expired or invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  return {
    session: {
      customer,
      authUserId: customer.authUserId,
      email: customer.email,
    },
    response: null,
  };
}

/**
 * Issues and sets the secure customer session cookie.
 */
export async function setCustomerSessionCookie(
  customerId: string,
  authUserId: string,
  email: string
): Promise<void> {
  const token = await createCustomerSessionToken(customerId, authUserId, email);
  const cookieStore = await cookies();

  cookieStore.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the customer session cookie upon logout.
 */
export async function clearCustomerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
