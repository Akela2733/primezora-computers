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
        return {
          success: false,
          provider: this.name,
          error: `Resend API returned HTTP ${response.status}.`,
        };
      }

      const data = (await response.json()) as { id?: string };
      return {
        success: true,
        messageId: data.id || "resend_sent",
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error:
          error instanceof Error
            ? error.message
            : "Unknown network error during email dispatch.",
      };
    }
  }
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
