import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";

import type { EmailMessage, EmailProvider } from "../src/lib/notifications/types";
import {
  issueCustomerEmailConfirmation,
  type CustomerEmailVerificationIssuer,
  type CustomerEmailVerificationRepository,
  type VerificationTokenRecord,
  verifyCustomerEmailConfirmation,
} from "../src/lib/email-confirmation-core";
import { ResendEmailProvider } from "../src/lib/notifications/providers";
import { getCustomerVerificationPageUrl } from "../src/lib/customer-registration";

const verificationTime = new Date("2030-01-01T00:00:00.000Z");
const rawToken = Buffer.alloc(32, 23).toString("base64url");
const rawTokenHash = createHash("sha256").update(rawToken).digest("hex");

function makeRecord(
  overrides: Partial<VerificationTokenRecord> = {}
): VerificationTokenRecord {
  return {
    id: "token-record",
    customerId: "customer-record",
    expiresAt: new Date(verificationTime.getTime() + 60_000),
    consumedAt: null,
    invalidatedAt: null,
    customerEmailVerified: false,
    ...overrides,
  };
}

function makeRepository(
  record: VerificationTokenRecord | null,
  confirmationResult: "verified" | "already_verified" | "already_used" | "expired" | "superseded" = "verified"
): CustomerEmailVerificationRepository {
  return {
    async findTokenByHash(hash) {
      assert.match(hash, /^[0-9a-f]{64}$/);
      assert.notEqual(hash, rawToken);
      return record;
    },
    async confirmToken(_tokenId, _customerId, now) {
      assert.equal(now.getTime(), verificationTime.getTime());
      return confirmationResult;
    },
  };
}

describe("customer email verification tokens", () => {
  test("failed registration produces exactly one state and preserves checkout destination", () => {
    const url = new URL(
      getCustomerVerificationPageUrl("customer+test@example.test", "/checkout", {
        sendFailed: true,
        cooldownSeconds: 60,
      }),
      "https://primezora.example"
    );
    assert.equal(url.searchParams.getAll("state").length, 1);
    assert.equal(url.searchParams.get("state"), "send-failed");
    assert.equal(url.searchParams.get("email"), "customer+test@example.test");
    assert.equal(url.searchParams.get("next"), "/checkout");
    assert.equal(url.searchParams.get("cooldown"), "60");
  });

  test("valid token is confirmed through the repository and only by its hash", async () => {
    let confirmed = false;
    const repository: CustomerEmailVerificationRepository = {
      async findTokenByHash(hash) {
        assert.equal(hash, rawTokenHash);
        return makeRecord();
      },
      async confirmToken(tokenId, customerId, now) {
        assert.equal(tokenId, "token-record");
        assert.equal(customerId, "customer-record");
        assert.equal(now.getTime(), verificationTime.getTime());
        confirmed = true;
        return "verified";
      },
    };

    assert.equal(
      await verifyCustomerEmailConfirmation(rawToken, repository, verificationTime),
      "verified"
    );
    assert.equal(confirmed, true);
  });

  test("expired, used, superseded, and already-verified tokens have distinct outcomes", async () => {
    assert.equal(
      await verifyCustomerEmailConfirmation(
        rawToken,
        makeRepository(makeRecord({ expiresAt: new Date(verificationTime.getTime() - 1) })),
        verificationTime
      ),
      "expired"
    );
    assert.equal(
      await verifyCustomerEmailConfirmation(
        rawToken,
        makeRepository(makeRecord({ consumedAt: verificationTime })),
        verificationTime
      ),
      "already_used"
    );
    assert.equal(
      await verifyCustomerEmailConfirmation(
        rawToken,
        makeRepository(makeRecord({ invalidatedAt: verificationTime })),
        verificationTime
      ),
      "superseded"
    );
    assert.equal(
      await verifyCustomerEmailConfirmation(
        rawToken,
        makeRepository(makeRecord({ customerEmailVerified: true })),
        verificationTime
      ),
      "already_verified"
    );
  });

  test("rejects malformed tokens without querying token storage", async () => {
    let queried = false;
    const repository: CustomerEmailVerificationRepository = {
      async findTokenByHash() {
        queried = true;
        return null;
      },
      async confirmToken() {
        return "already_used";
      },
    };
    assert.equal(
      await verifyCustomerEmailConfirmation("short", repository, verificationTime),
      "invalid"
    );
    assert.equal(queried, false);
  });

  test("issues only a hash, uses the configured verification URL, and reports provider acceptance", async () => {
    const originalSiteUrl = process.env.PUBLIC_SITE_URL;
    process.env.PUBLIC_SITE_URL = "https://primezora.example/";
    let storedHash = "";
    let sentMessage: EmailMessage | undefined;
    const issuer: CustomerEmailVerificationIssuer = {
      async createToken(input) {
        storedHash = input.tokenHash;
        assert.equal(input.expiresAt.getTime() - input.now.getTime(), 24 * 60 * 60 * 1000);
        return { issued: true };
      },
      async invalidateToken() {
        assert.fail("An accepted email must not invalidate its token.");
      },
    };
    const provider: EmailProvider = {
      name: "resend",
      async sendEmail(message) {
        sentMessage = message;
        return { success: true, provider: "resend", messageId: "provider-accepted" };
      },
    };

    try {
      const result = await issueCustomerEmailConfirmation(
        {
          id: "customer-record",
          email: "customer@example.test",
          name: "Primezora Customer",
          nextPath: "/checkout",
        },
        { repository: issuer, provider, now: verificationTime }
      );
      assert.deepEqual(result, { success: true });
      assert.match(storedHash, /^[0-9a-f]{64}$/);
      const message = sentMessage!;
      const link = new URL(message.text.match(/https:\/\/\S+/)![0]);
      assert.equal(link.origin, "https://primezora.example");
      assert.equal(link.pathname, "/verify-email");
      assert.equal(link.searchParams.get("next"), "/checkout");
      assert.equal(link.searchParams.has("token"), false);
      const token = new URLSearchParams(link.hash.slice(1)).get("token");
      assert.equal(
        createHash("sha256").update(token!).digest("hex"),
        storedHash
      );
      assert.notEqual(token, storedHash);
    } finally {
      if (originalSiteUrl === undefined) delete process.env.PUBLIC_SITE_URL;
      else process.env.PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  test("provider rejection invalidates the issued token and does not return provider details", async () => {
    let invalidatedHash = "";
    const issuer: CustomerEmailVerificationIssuer = {
      async createToken() {
        return { issued: true };
      },
      async invalidateToken(tokenHash) {
        invalidatedHash = tokenHash;
      },
    };
    const provider: EmailProvider = {
      name: "resend",
      async sendEmail() {
        return {
          success: false,
          provider: "resend",
          error: "TEST_ONLY_PROVIDER_SECRET",
        };
      },
    };

    const result = await issueCustomerEmailConfirmation(
      {
        id: "customer-record",
        email: "customer@example.test",
        name: "Primezora Customer",
      },
      { repository: issuer, provider, now: verificationTime }
    );

    assert.deepEqual(result, {
      success: false,
      error: "We could not send the verification email. Please try again later.",
      retryAfterSeconds: 60,
    });
    assert.match(invalidatedHash, /^[0-9a-f]{64}$/);
    assert.doesNotMatch(JSON.stringify(result), /TEST_ONLY_PROVIDER_SECRET/);
  });

  test("does not treat the console mock as delivered email", async () => {
    const issuer: CustomerEmailVerificationIssuer = {
      async createToken() {
        assert.fail("Console delivery must be rejected before creating a token.");
      },
      async invalidateToken() {},
    };
    const provider: EmailProvider = {
      name: "console",
      async sendEmail() {
        return { success: true, provider: "console", messageId: "mock" };
      },
    };

    const result = await issueCustomerEmailConfirmation(
      {
        id: "customer-record",
        email: "customer@example.test",
        name: "Primezora Customer",
      },
      { repository: issuer, provider, now: verificationTime }
    );
    assert.deepEqual(result, {
      success: false,
      error: "Email delivery is not configured.",
    });
  });

  test("returns a resend cooldown without attempting a provider send", async () => {
    const issuer: CustomerEmailVerificationIssuer = {
      async createToken() {
        return { issued: false, retryAfterSeconds: 17 };
      },
      async invalidateToken() {
        assert.fail("A token that was not issued must not be invalidated.");
      },
    };
    const provider: EmailProvider = {
      name: "resend",
      async sendEmail() {
        assert.fail("A provider must not be called during the resend cooldown.");
      },
    };

    const result = await issueCustomerEmailConfirmation(
      {
        id: "customer-record",
        email: "customer@example.test",
        name: "Primezora Customer",
      },
      { repository: issuer, provider, now: verificationTime }
    );
    assert.deepEqual(result, {
      success: false,
      error: "This account is already verified or a verification email was sent recently.",
      retryAfterSeconds: 17,
    });
  });

  test("Resend sends with bearer authorization and reports provider acceptance", async () => {
    const originalFetch = globalThis.fetch;
    let authorization = "";
    let requestBody: Record<string, unknown> | undefined;
    globalThis.fetch = async (_input, init) => {
      authorization = new Headers(init?.headers).get("Authorization") ?? "";
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ id: "resend-message-id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      const provider = new ResendEmailProvider(
        "re_test_only_api_key",
        "Primezora <verify@example.test>"
      );
      const result = await provider.sendEmail({
        to: "customer@example.test",
        subject: "Verify",
        html: "<p>Verify</p>",
        text: "Verify",
      });
      assert.deepEqual(result, {
        success: true,
        messageId: "resend-message-id",
        provider: "resend",
      });
      assert.equal(authorization, "Bearer re_test_only_api_key");
      assert.equal(requestBody?.from, "Primezora <verify@example.test>");
      assert.equal(requestBody?.to, "customer@example.test");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Resend rejection exposes only its HTTP status, not provider response content", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response("TEST_ONLY_PROVIDER_RESPONSE_SECRET", { status: 403 });

    try {
      const provider = new ResendEmailProvider("re_test_only_api_key");
      const result = await provider.sendEmail({
        to: "customer@example.test",
        subject: "Verify",
        html: "<p>Verify</p>",
        text: "Verify",
      });
      assert.deepEqual(result, {
        success: false,
        provider: "resend",
        error: "Resend API returned HTTP 403.",
      });
      assert.doesNotMatch(JSON.stringify(result), /TEST_ONLY_PROVIDER_RESPONSE_SECRET/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
