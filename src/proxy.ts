import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-session";
import { applySecurityHeaders } from "@/lib/security-headers";

function withSecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  applySecurityHeaders(response.headers, {
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isHttps: request.nextUrl.protocol === "https:",
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow auth endpoints and static Next.js assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/admin") ||
    pathname.includes(".")
  ) {
    return withSecurityHeaders(NextResponse.next(), request);
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = await verifyAdminSessionToken(token);

  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/register" ||
    pathname === "/admin/forgot" ||
    pathname === "/admin/forgot-password";

  // If navigating to auth pages
  if (isAuthPage) {
    if (isAuthenticated) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const redirectTarget =
        nextParam &&
        nextParam.startsWith("/admin") &&
        !isAuthPage
          ? nextParam
          : "/admin";
      return withSecurityHeaders(
        NextResponse.redirect(new URL(redirectTarget, request.url)),
        request
      );
    }
    return withSecurityHeaders(NextResponse.next(), request);
  }

  // Protect /api/admin/* routes
  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      const customerSession = await verifyCustomerSessionToken(
        request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value
      );
      if (customerSession) {
        return withSecurityHeaders(
          NextResponse.json(
            { error: "Administrator access required." },
            { status: 403 }
          ),
          request
        );
      }

      return withSecurityHeaders(
        NextResponse.json(
          {
            error: "Authentication required.",
            loginUrl: "/admin/login",
          },
          { status: 401 }
        ),
        request
      );
    }
    return withSecurityHeaders(NextResponse.next(), request);
  }

  // Protect /admin and /admin/* routes
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      const returnUrl = `${pathname}${search}`;
      if (returnUrl && returnUrl !== "/admin") {
        loginUrl.searchParams.set("next", returnUrl);
      }
      return withSecurityHeaders(NextResponse.redirect(loginUrl), request);
    }
    return withSecurityHeaders(NextResponse.next(), request);
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
