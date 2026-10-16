import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

import {
  buildCustomerPasswordResetUrl,
  createCustomerPasswordRecoveryEmail,
  getCustomerPasswordRecoveryConfigurationError,
} from "../src/lib/customer-password-recovery";
import type { EmailProvider } from "../src/lib/notifications/types";

const originalEnvironment = {
  nodeEnv: process.env.NODE_ENV,
  publicSiteUrl: process.env.PUBLIC_SITE_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  legacyAppUrl: process.env.APP_URL,
  emailFrom: process.env.EMAIL_FROM,
};

after(() => {
  if (originalEnvironment.nodeEnv === undefined) {
    Reflect.deleteProperty(process.env, "NODE_ENV");
  } else {
    Reflect.set(process.env, "NODE_ENV", originalEnvironment.nodeEnv);
  }
  if (originalEnvironment.publicSiteUrl === undefined) delete process.env.PUBLIC_SITE_URL;
  else process.env.PUBLIC_SITE_URL = originalEnvironment.publicSiteUrl;
  if (originalEnvironment.appUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalEnvironment.appUrl;
  if (originalEnvironment.legacyAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalEnvironment.legacyAppUrl;
  if (originalEnvironment.emailFrom === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = originalEnvironment.emailFrom;
});

const resendProvider: EmailProvider = {
  name: "resend",
  async sendEmail() {
    return { success: true, provider: "resend" };
  },
};

describe("customer password recovery", () => {
  test("reset links keep recovery tokens in the fragment and validate the return path separately", () => {
    const url = new URL(
      buildCustomerPasswordResetUrl(
        "a_secure-token_hash",
        "/checkout?step=delivery",
        "https://primezora.example/"
      )
    );

    assert.equal(url.origin, "https://primezora.example");
    assert.equal(url.pathname, "/reset-password");
    assert.equal(url.searchParams.get("next"), "/checkout?step=delivery");
    assert.equal(
      new URLSearchParams(url.hash.slice(1)).get("token_hash"),
      "a_secure-token_hash"
    );
    assert.equal(url.searchParams.has("token_hash"), false);
  });

  test("recovery email escapes reset links in HTML and includes a text alternative", () => {
    const email = createCustomerPasswordRecoveryEmail(
      "https://primezora.example/reset?value=a&other=<unsafe>"
    );

    assert.match(email.subject, /Reset your Primezora password/);
    assert.match(email.html, /value=a&amp;other=&lt;unsafe&gt;/);
    assert.doesNotMatch(email.html, /other=<unsafe>/);
    assert.match(email.text, /value=a&other=<unsafe>/);
  });

  test("recovery requires a live email provider and a valid production origin and sender", () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    delete process.env.PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;
    process.env.EMAIL_FROM = "Primezora <reset@primezora.example>";

    assert.equal(
      getCustomerPasswordRecoveryConfigurationError(resendProvider),
      "missing_public_site_url"
    );

    process.env.PUBLIC_SITE_URL = "https://primezora.example";
    assert.equal(
      getCustomerPasswordRecoveryConfigurationError(resendProvider),
      null
    );

    process.env.EMAIL_FROM = "unverified sender";
    assert.equal(
      getCustomerPasswordRecoveryConfigurationError(resendProvider),
      "invalid_email_from"
    );

    assert.equal(
      getCustomerPasswordRecoveryConfigurationError({
        ...resendProvider,
        name: "console",
      }),
      "missing_email_provider"
    );
  });
});
