import { config } from "dotenv";
import { ResendEmailProvider } from "../src/lib/notifications/providers";

config({ path: ".env.local" });
config();

async function main() {
  const recipient = process.env.TEST_EMAIL_TO?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender =
    process.env.EMAIL_FROM?.trim() || "Primezora <onboarding@resend.dev>";

  if (process.env.NODE_ENV === "production") {
    throw new Error("The email-delivery test cannot run in production.");
  }
  if (process.env.CONFIRM_EMAIL_SEND !== "1") {
    throw new Error(
      "Set CONFIRM_EMAIL_SEND=1 to explicitly authorize this test send."
    );
  }
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Set TEST_EMAIL_TO to a valid, permitted test recipient.");
  }
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required; no email was sent.");
  }

  const provider = new ResendEmailProvider(apiKey, sender);
  const result = await provider.sendEmail({
    to: recipient,
    from: sender,
    subject: "Primezora transactional email test",
    html: "<p>This is a test of Primezora's transactional email delivery.</p>",
    text: "This is a test of Primezora's transactional email delivery.",
  });

  if (!result.success) {
    console.error(
      "Email test was not accepted by Resend.",
      JSON.stringify({
        provider: result.provider,
        category: result.errorCategory ?? "provider",
        httpStatus: result.httpStatus ?? null,
        providerCode: result.errorCode ?? null,
      })
    );
    process.exitCode = 1;
  } else {
    console.info("Resend accepted the test email.", {
      provider: result.provider,
      messageId: result.messageId,
    });
  }
}

main().catch(() => {
  console.error("Email-delivery test stopped before provider acceptance.");
  process.exitCode = 1;
});
