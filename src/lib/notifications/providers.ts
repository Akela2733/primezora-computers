/**
 * @file src/lib/notifications/providers.ts
 *
 * Isolated email provider implementations and factory.
 * Default is `ConsoleEmailProvider` to prevent sending real emails until configured.
 */

import { EmailMessage, EmailProvider, EmailSendResult } from "./types";

/**
 * Console/Mock Provider: Returns a mock success without external network calls.
 * Used by default when no live email provider credentials are configured.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async sendEmail(): Promise<EmailSendResult> {
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: this.name,
    };
  }
}

/**
 * Resend Provider: Integrates with Resend REST API (https://resend.com).
 * Activated automatically when `RESEND_API_KEY` is configured in environment variables.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string = "Primezora <orders@primezora.com>"
  ) {}

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from || this.fromAddress,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
        }),
      });

      if (!response.ok) {
        let errorPayload: unknown;
        try {
          errorPayload = await response.json();
        } catch {
          errorPayload = null;
        }
        const providerError =
          typeof errorPayload === "object" && errorPayload !== null
            ? (errorPayload as Record<string, unknown>)
            : {};
        const rawCode =
          typeof providerError.name === "string"
            ? providerError.name
            : typeof providerError.code === "string"
              ? providerError.code
              : undefined;
        const knownErrorCodes = new Set([
          "domain_not_found",
          "domain_not_verified",
          "invalid_api_key",
          "invalid_from_address",
          "invalid_parameter",
          "invalid_region",
          "missing_required_field",
          "rate_limit_exceeded",
          "restricted_api_key",
        ]);
        const normalizedCode = rawCode?.toLowerCase();
        const errorCode =
          normalizedCode && knownErrorCodes.has(normalizedCode)
            ? normalizedCode
            : undefined;
        const providerMessage =
          typeof providerError.message === "string"
            ? providerError.message.toLowerCase()
            : "";
        const category = classifyResendError(
          response.status,
          `${errorCode ?? ""} ${providerMessage}`
        );
        return {
          success: false,
          provider: this.name,
          error: "Resend rejected the email request.",
          httpStatus: response.status,
          ...(errorCode ? { errorCode } : {}),
          errorCategory: category,
        };
      }

      const data = (await response.json()) as { id?: string };
      return {
        success: true,
        messageId: data.id || "resend_sent",
        provider: this.name,
      };
    } catch {
      return {
        success: false,
        provider: this.name,
        error: "Resend email request failed before acceptance.",
        errorCategory: "network",
      };
    }
  }
}

function classifyResendError(
  status: number,
  providerDetails: string
): NonNullable<EmailSendResult["errorCategory"]> {
  if (/rate.?limit|too many requests/.test(providerDetails) || status === 429) {
    return "rate_limit";
  }
  if (
    /domain|sender|from address|from email|not verified|verified domain/.test(
      providerDetails
    )
  ) {
    return "sender_domain";
  }
  if (
    /recipient|to address|invalid email|invalid.{0,20}\bto\b|\bto\b.{0,20}invalid/.test(
      providerDetails
    )
  ) {
    return "recipient";
  }
  if (status === 401 || /api.?key|unauthorized|authentication/.test(providerDetails)) {
    return "authorization";
  }
  if (/restricted|suspend|disabled|account/.test(providerDetails)) {
    return "account_restriction";
  }
  return "provider";
}

/**
 * Resolves the active email provider.
 * Falls back to ConsoleEmailProvider if no credentials are configured.
 */
export function getEmailProvider(): EmailProvider {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.EMAIL_FROM || "Primezora <orders@primezora.com>";

  if (resendApiKey && resendApiKey.trim().length > 0) {
    return new ResendEmailProvider(resendApiKey.trim(), fromAddress);
  }

  return new ConsoleEmailProvider();
}
