import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import { logger } from "@/lib/logger";
import { getEmailProvider } from "@/lib/notifications/providers";
import type { EmailProvider } from "@/lib/notifications/types";

export const CUSTOMER_EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
export const CUSTOMER_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

export type CustomerEmailVerificationStatus =
  | "verified"
  | "already_verified"
  | "expired"
  | "already_used"
  | "superseded"
  | "invalid";

export type VerificationTokenRecord = {
  id: string;
  customerId: string;
  expiresAt: Date;
  consumedAt: Date | null;
  invalidatedAt: Date | null;
  customerEmailVerified: boolean;
};

export type CustomerEmailVerificationRepository = {
  findTokenByHash(tokenHash: string): Promise<VerificationTokenRecord | null>;
  confirmToken(
    tokenId: string,
    customerId: string,
    now: Date
  ): Promise<Exclude<CustomerEmailVerificationStatus, "invalid">>;
};

export type CustomerEmailVerificationIssuer = {
  createToken(input: {
    customerId: string;
    tokenHash: string;
    now: Date;
    expiresAt: Date;
  }): Promise<{ issued: boolean; retryAfterSeconds?: number }>;
  invalidateToken(tokenHash: string, now: Date): Promise<void>;
};

function getBaseUrl(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

type VerificationConfigurationError =
  | "missing_resend_api_key"
  | "missing_public_site_url"
  | "invalid_public_site_url"
  | "missing_email_from"
  | "invalid_email_from";

const EMAIL_ADDRESS_PATTERN =
  "[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";

function getVerificationConfigurationError(
  provider: EmailProvider
): VerificationConfigurationError | null {
  if (provider.name === "console") return "missing_resend_api_key";

  const production = process.env.NODE_ENV === "production";
  const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();
  if (production && !configuredSiteUrl) return "missing_public_site_url";

  const siteUrl = configuredSiteUrl || getBaseUrl();
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

function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildEmailConfirmationUrl(
  token: string,
  options: { email?: string; nextPath?: string } = {}
): string {
  const url = new URL("/verify-email", getBaseUrl());
  if (options.email) url.searchParams.set("email", options.email);
  url.searchParams.set(
    "next",
    getSafeCustomerRedirectPath(options.nextPath)
  );
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}

export function getPrismaVerificationRepository(
  db: PrismaClient
): CustomerEmailVerificationRepository {
  return {
    async findTokenByHash(tokenHash) {
      const record = await db.customerEmailVerificationToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          customerId: true,
          expiresAt: true,
          consumedAt: true,
          invalidatedAt: true,
          customer: { select: { emailVerified: true } },
        },
      });

      if (!record) return null;
      return {
        id: record.id,
        customerId: record.customerId,
        expiresAt: record.expiresAt,
        consumedAt: record.consumedAt,
        invalidatedAt: record.invalidatedAt,
        customerEmailVerified: record.customer.emailVerified,
      };
    },
    async confirmToken(tokenId, customerId, now) {
      return db.$transaction(async (transaction) => {
        const token = await transaction.customerEmailVerificationToken.updateMany({
          where: {
            id: tokenId,
            customerId,
            consumedAt: null,
            invalidatedAt: null,
            expiresAt: { gt: now },
          },
          data: { consumedAt: now },
        });
        if (token.count !== 1) {
          const current = await transaction.customerEmailVerificationToken.findUnique({
            where: { id: tokenId },
            select: {
              expiresAt: true,
              consumedAt: true,
              invalidatedAt: true,
              customer: { select: { emailVerified: true } },
            },
          });
          if (!current) return "already_used";
          const status = getVerificationStatus(
            {
              id: tokenId,
              customerId,
              expiresAt: current.expiresAt,
              consumedAt: current.consumedAt,
              invalidatedAt: current.invalidatedAt,
              customerEmailVerified: current.customer.emailVerified,
            },
            now
          );
          return status === "invalid" ? "already_used" : status;
        }

        const customer = await transaction.customer.updateMany({
          where: { id: customerId, emailVerified: false },
          data: { emailVerified: true, emailVerifiedAt: now },
        });
        await transaction.customerEmailVerificationToken.updateMany({
          where: {
            customerId,
            id: { not: tokenId },
            consumedAt: null,
            invalidatedAt: null,
          },
          data: { invalidatedAt: now },
        });
        return customer.count === 1 ? "verified" : "already_verified";
      });
    },
  };
}

export function getPrismaVerificationIssuer(
  db: PrismaClient
): CustomerEmailVerificationIssuer {
  return {
    async createToken({ customerId, tokenHash, now, expiresAt }) {
      const cooldownCutoff = new Date(
        now.getTime() - CUSTOMER_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
      );
      const issueResult = await db.$transaction(async (transaction) => {
        const customer = await transaction.customer.updateMany({
          where: {
            id: customerId,
            emailVerified: false,
            OR: [
              { emailVerificationSentAt: null },
              { emailVerificationSentAt: { lte: cooldownCutoff } },
            ],
          },
          data: { emailVerificationSentAt: now },
        });
        if (customer.count !== 1) return false;

        await transaction.customerEmailVerificationToken.updateMany({
          where: {
            customerId,
            consumedAt: null,
            invalidatedAt: null,
          },
          data: { invalidatedAt: now },
        });
        await transaction.customerEmailVerificationToken.create({
          data: {
            customerId,
            tokenHash,
            expiresAt,
          },
        });
        return true;
      });

      if (issueResult) return { issued: true };

      const current = await db.customer.findUnique({
        where: { id: customerId },
        select: { emailVerified: true, emailVerificationSentAt: true },
      });
      const retryAfterSeconds =
        current?.emailVerificationSentAt &&
        current.emailVerificationSentAt.getTime() >
          now.getTime() - CUSTOMER_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
          ? Math.ceil(
              (current.emailVerificationSentAt.getTime() +
                CUSTOMER_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS -
                now.getTime()) /
                1000
            )
          : undefined;
      return {
        issued: false,
        ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
      };
    },
    async invalidateToken(tokenHash, now) {
      await db.customerEmailVerificationToken.updateMany({
        where: { tokenHash, consumedAt: null },
        data: { invalidatedAt: now },
      });
    },
  };
}

function getVerificationStatus(
  record: VerificationTokenRecord | null,
  now: Date
): CustomerEmailVerificationStatus {
  if (!record) return "invalid";
  if (record.consumedAt) return "already_used";
  if (record.customerEmailVerified) return "already_verified";
  if (record.invalidatedAt) return "superseded";
  if (record.expiresAt <= now) return "expired";
  return "invalid";
}

export async function verifyCustomerEmailConfirmation(
  rawToken: string,
  repository: CustomerEmailVerificationRepository,
  now = new Date()
): Promise<CustomerEmailVerificationStatus> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(rawToken)) return "invalid";

  const tokenHash = hashVerificationToken(rawToken);
  const record = await repository.findTokenByHash(tokenHash);
  if (!record) return "invalid";

  const initialStatus = getVerificationStatus(record, now);
  if (initialStatus !== "invalid") return initialStatus;

  return repository.confirmToken(
    record.id,
    record.customerId,
    now
  );
}

function createVerificationEmail(params: {
  customerName: string;
  confirmationUrl: string;
}) {
  const customerName = escapeHtml(params.customerName);
  const confirmationUrl = escapeHtml(params.confirmationUrl);

  return {
    subject: "Confirm your Primezora account | Primezora Technologies",
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Confirm your Primezora account</title></head>
  <body style="margin:0;padding:0;background:#05090f;color:#f8fafc;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05090f;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0b111a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px;background:#111827;border-bottom:1px solid #1e293b;">
            <div style="letter-spacing:0.2em;text-transform:uppercase;color:#f59e0b;font-size:14px;font-weight:700;">Primezora</div>
            <div style="margin-top:8px;color:#cbd5e1;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Computer Solutions</div>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:26px;color:#f8fafc;">Confirm your email</h1>
            <p style="margin:0 0 24px;color:#cbd5e1;line-height:1.7;font-size:15px;">Hi <strong>${customerName}</strong>, confirm your email address to activate your Primezora account and securely access your orders.</p>
            <p style="margin:0 0 24px;text-align:center;"><a href="${confirmationUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#111827;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;">Verify my email</a></p>
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.7;">If the button does not work, copy and paste this link into your browser:<br /><span style="word-break:break-all;color:#fbbf24;">${confirmationUrl}</span></p>
          </td></tr>
          <tr><td style="padding:0 32px 32px;color:#64748b;font-size:12px;line-height:1.7;">This link expires in 24 hours and can only be used once. If you did not create a Primezora account, you can ignore this email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    text: `Hi ${params.customerName},\n\nConfirm your email address to activate your Primezora account and securely access your orders.\n\nVerify your email: ${params.confirmationUrl}\n\nThis link expires in 24 hours and can only be used once. If you did not create a Primezora account, you can ignore this email.`,
  };
}

export async function issueCustomerEmailConfirmation(
  params: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    nextPath?: string;
  },
  dependencies: {
    repository: CustomerEmailVerificationIssuer;
    provider?: EmailProvider;
    now?: Date;
  }
): Promise<
  | { success: true }
  | { success: false; error: string; retryAfterSeconds?: number }
> {
  const provider = dependencies.provider ?? getEmailProvider();
  const now = dependencies.now ?? new Date();
  const repository = dependencies.repository;

  const configurationError = getVerificationConfigurationError(provider);
  if (configurationError) {
    logger.error(
      "CUSTOMER_EMAIL_VERIFICATION_CONFIGURATION_INVALID",
      new Error(
        JSON.stringify({
          provider: provider.name,
          category: "configuration",
          cause: configurationError,
        })
      )
    );
    return { success: false, error: "Email delivery is not configured." };
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(now.getTime() + CUSTOMER_EMAIL_VERIFICATION_TTL_MS);
  const customerName =
    params.name?.trim() ||
    [params.firstName, params.lastName].filter(Boolean).join(" ").trim() ||
    "Customer";

  const issueResult = await repository.createToken({
    customerId: params.id,
    tokenHash,
    now,
    expiresAt,
  });

  if (!issueResult.issued) {
    return {
      success: false,
      error: "This account is already verified or a verification email was sent recently.",
      ...(issueResult.retryAfterSeconds
        ? { retryAfterSeconds: issueResult.retryAfterSeconds }
        : {}),
    };
  }

  const email = createVerificationEmail({
    customerName,
    confirmationUrl: buildEmailConfirmationUrl(rawToken, {
      email: params.email,
      nextPath: params.nextPath,
    }),
  });
  const sender =
    process.env.EMAIL_FROM?.trim() || "Primezora <onboarding@resend.dev>";

  let emailAccepted = false;
  try {
    const result = await provider.sendEmail({
      to: params.email,
      from: sender,
      ...email,
    });
    emailAccepted = result.success && !result.skipped;
    if (!emailAccepted) {
      logger.error(
        "CUSTOMER_EMAIL_VERIFICATION_PROVIDER_REJECTED",
        new Error(
          JSON.stringify({
            provider: result.provider,
            category: result.errorCategory ?? "provider",
            httpStatus: result.httpStatus ?? null,
            providerCode: result.errorCode ?? null,
          })
        )
      );
    }
  } catch {
    emailAccepted = false;
    logger.error(
      "CUSTOMER_EMAIL_VERIFICATION_PROVIDER_REQUEST_FAILED",
      new Error("Email provider request failed.")
    );
  }

  if (!emailAccepted) {
    await repository.invalidateToken(tokenHash, new Date());
    return {
      success: false,
      error: "We could not send the verification email. Please try again later.",
      retryAfterSeconds: Math.ceil(
        CUSTOMER_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS / 1000
      ),
    };
  }

  return { success: true };
}
