export type SecurityHeaderOptions = {
  isDevelopment: boolean;
  isProduction: boolean;
  isHttps: boolean;
};

export function buildContentSecurityPolicy(
  isDevelopment: boolean
): string {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (isDevelopment) scriptSources.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
  ].join("; ");
}

export function applySecurityHeaders(
  headers: Headers,
  options: SecurityHeaderOptions
): void {
  headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(options.isDevelopment)
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  if (options.isProduction && options.isHttps) {
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }
}
