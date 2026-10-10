import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getEmailProvider } from "@/lib/notifications/providers";

const EMAIL_CONFIRMATION_TTL_MS = 1000 * 60 * 60 * 24;

function getBaseUrl(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function formatCustomerName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Customer";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function buildEmailConfirmationUrl(token: string): string {
  return `${getBaseUrl()}/confirm-email?token=${encodeURIComponent(token)}`;
}

export async function issueCustomerEmailConfirmation(params: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_CONFIRMATION_TTL_MS);
  const confirmationUrl = buildEmailConfirmationUrl(token);
  const customerName = escapeHtml(
    params.name || formatCustomerName(params.firstName, params.lastName)
  );
  const escapedConfirmationUrl = escapeHtml(confirmationUrl);
  const provider = getEmailProvider();

  if (provider.name === "console") {
    return {
      success: false,
      error: "Email delivery is not configured.",
    };
  }

  await prisma.customer.update({
    where: { id: params.id },
    data: {
      emailVerificationToken: token,
      emailVerificationSentAt: new Date(),
      emailVerificationExpiresAt: expiresAt,
      emailVerified: false,
      emailVerifiedAt: null,
    },
  });

  const emailResult = await provider.sendEmail({
    to: params.email,
    subject: "Confirm your Primezora account | Primezora Technologies",
    html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Confirm your Primezora account</title>
        </head>
        <body style="margin:0; padding:0; background:#05090f; color:#f8fafc; font-family:Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05090f; padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#0b111a; border:1px solid #1e293b; border-radius:16px; overflow:hidden;">
                  <tr>
                    <td style="padding:32px 32px 18px; background:linear-gradient(180deg, #111827 0%, #0b111a 100%); border-bottom:1px solid #1e293b;">
                      <div style="letter-spacing:0.2em; text-transform:uppercase; color:#f59e0b; font-size:11px; font-weight:700;">Primezora</div>
                      <div style="margin-top:8px; color:#cbd5e1; font-size:12px; letter-spacing:0.18em; text-transform:uppercase;">Technology &amp; Performance</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <h1 style="margin:0 0 12px; font-size:26px; color:#f8fafc;">Confirm your email</h1>
                      <p style="margin:0 0 20px; color:#cbd5e1; line-height:1.7; font-size:15px;">
                        Hi <strong>${customerName}</strong>,<br /><br />
                        Welcome to Primezora. Please confirm your email address to activate your customer account and start tracking orders securely.
                      </p>
                      <p style="margin:0 0 28px; text-align:center;">
                        <a href="${escapedConfirmationUrl}" style="display:inline-block; background:linear-gradient(135deg, #f59e0b, #d97706); color:#111827; text-decoration:none; font-weight:700; padding:14px 28px; border-radius:12px;">Confirm my email</a>
                      </p>
                      <p style="margin:0; color:#94a3b8; font-size:13px; line-height:1.7;">
                        If the button does not work, copy and paste this link into your browser:<br />
                        <span style="word-break:break-all; color:#fbbf24;">${escapedConfirmationUrl}</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px; color:#64748b; font-size:12px; line-height:1.7;">
                      This confirmation link expires in 24 hours. If you did not create a Primezora account, you can ignore this email.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Hi ${customerName},\n\nWelcome to Primezora. Please confirm your email address to activate your customer account.\n\nConfirm here: ${confirmationUrl}\n\nThis confirmation link expires in 24 hours. If you did not create a Primezora account, you can ignore this email.`,
  });

  if (!emailResult.success) {
    return {
      success: false,
      error: emailResult.error || "Unable to send a confirmation email right now.",
    };
  }

  return {
    success: true,
  };
}

export async function verifyCustomerEmailConfirmation(token: string) {
  if (!token || token.trim().length < 16) {
    return false;
  }

  const customer = await prisma.customer.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!customer) {
    return false;
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationSentAt: null,
      emailVerificationExpiresAt: null,
    },
  });

  return true;
}
