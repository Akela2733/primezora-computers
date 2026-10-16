import { logger } from "@/lib/logger";
import { getEmailProvider } from "@/lib/notifications/providers";
import type { EmailProvider } from "@/lib/notifications/types";

const EMAIL_ADDRESS_PATTERN =
  "[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";

export function getCustomerPasswordRecoveryConfigurationError(
  provider: EmailProvider = getEmailProvider()
): string | null {
  if (provider.name === "console") return "missing_email_provider";

  const production = process.env.NODE_ENV === "production";
  const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();
  if (production && !configuredSiteUrl) return "missing_public_site_url";

  const siteUrl =
    configuredSiteUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  try {
    const parsed = new URL(siteUrl);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (production && parsed.protocol !== "https:") ||
      parsed.pathname !== "/"
    ) {
      return "invalid_public_site_url";
    }
  } catch {
    return "invalid_public_site_url";
  }

  const emailFrom = process.env.EMAIL_FROM?.trim();
  if (production && !emailFrom) return "missing_email_from";
  if (
    emailFrom &&
    !new RegExp(
      `^(?:[^<>]*<${EMAIL_ADDRESS_PATTERN}>|${EMAIL_ADDRESS_PATTERN})$`
    ).test(emailFrom)
  ) {
    return "invalid_email_from";
  }

  return null;
}

export function buildCustomerPasswordResetUrl(
  tokenHash: string,
  nextPath?: string,
  baseUrl =
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
): string {
  const url = new URL("/reset-password", baseUrl.replace(/\/+$/, ""));
  if (nextPath) url.searchParams.set("next", nextPath);
  url.hash = new URLSearchParams({ token_hash: tokenHash }).toString();
  return url.toString();
}

export function createCustomerPasswordRecoveryEmail(resetUrl: string) {
  const escapedUrl = resetUrl.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

  return {
    subject: "Reset your Primezora password",
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Reset your password</title></head>
  <body style="margin:0;padding:0;background:#05090f;color:#f8fafc;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05090f;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0b111a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px;background:#111827;border-bottom:1px solid #1e293b;">
            <div style="letter-spacing:0.2em;text-transform:uppercase;color:#f59e0b;font-size:14px;font-weight:700;">Primezora</div>
            <div style="margin-top:8px;color:#cbd5e1;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Computer Solutions</div>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:26px;color:#f8fafc;">Reset your password</h1>
            <p style="margin:0 0 24px;color:#cbd5e1;line-height:1.7;font-size:15px;">We received a request to reset your Primezora account password. Use the secure link below to choose a new password.</p>
            <p style="margin:0 0 24px;text-align:center;"><a href="${escapedUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#111827;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;">Reset my password</a></p>
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.7;">If the button does not work, copy and paste this link into your browser:<br /><span style="word-break:break-all;color:#fbbf24;">${escapedUrl}</span></p>
          </td></tr>
          <tr><td style="padding:0 32px 32px;color:#64748b;font-size:12px;line-height:1.7;">This single-use link expires according to your account security settings. If you did not request a password reset, you can ignore this email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    text: `We received a request to reset your Primezora account password.\n\nReset your password: ${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
  };
}

export async function sendCustomerPasswordRecoveryEmail(
  email: string,
  resetUrl: string,
  provider: EmailProvider = getEmailProvider()
): Promise<boolean> {
  try {
    const result = await provider.sendEmail({
      to: email,
      from:
        process.env.EMAIL_FROM?.trim() ||
        "Primezora <onboarding@resend.dev>",
      ...createCustomerPasswordRecoveryEmail(resetUrl),
    });
    if (result.success && !result.skipped) return true;

    logger.error(
      "CUSTOMER_PASSWORD_RECOVERY_EMAIL_REJECTED",
      new Error(
        JSON.stringify({
          provider: result.provider,
          category: result.errorCategory ?? "provider",
          httpStatus: result.httpStatus ?? null,
          providerCode: result.errorCode ?? null,
        })
      )
    );
    return false;
  } catch {
    logger.error(
      "CUSTOMER_PASSWORD_RECOVERY_EMAIL_REQUEST_FAILED",
      new Error("Email provider request failed.")
    );
    return false;
  }
}
