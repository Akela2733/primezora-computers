import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-session";

export async function requireAdminOrdersApi(): Promise<NextResponse | null> {
  const authError = await requireAdminApi();
  if (!authError) return null;

  const cookieStore = await cookies();
  const customerSession = await verifyCustomerSessionToken(
    cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value
  );

  if (customerSession) {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 }
    );
  }

  return authError;
}
