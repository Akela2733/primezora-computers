import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
}

export async function requireAdminPage(nextPath?: string): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    if (
      nextPath &&
      nextPath.startsWith("/admin") &&
      nextPath !== "/admin/login"
    ) {
      redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
    }
    redirect("/admin/login");
  }
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await isAdminAuthenticated()) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Authentication required.",
      loginUrl: "/admin/login",
    },
    { status: 401 }
  );
}