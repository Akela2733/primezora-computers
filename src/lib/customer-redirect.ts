const REDIRECT_ORIGIN = "https://customer.invalid";

export function getSafeCustomerRedirectPath(
  nextParam: unknown,
  fallback = "/account"
): string {
  if (typeof nextParam !== "string" || !nextParam.startsWith("/")) {
    return fallback;
  }

  try {
    const redirectUrl = new URL(nextParam, REDIRECT_ORIGIN);
    if (
      redirectUrl.origin !== REDIRECT_ORIGIN ||
      redirectUrl.pathname.startsWith("/admin") ||
      redirectUrl.pathname === "/login" ||
      redirectUrl.pathname === "/register"
    ) {
      return fallback;
    }

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return fallback;
  }
}
