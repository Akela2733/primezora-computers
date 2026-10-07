import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
} from "../src/lib/security-headers";

describe("security response headers", () => {
  test("sets the baseline security headers and app-compatible CSP", () => {
    const headers = new Headers();
    applySecurityHeaders(headers, {
      isDevelopment: false,
      isProduction: false,
      isHttps: false,
    });

    const csp = headers.get("content-security-policy");
    assert.ok(csp);
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /script-src 'self' 'unsafe-inline'/);
    assert.match(csp, /style-src 'self' 'unsafe-inline'/);
    assert.match(csp, /img-src 'self' data: blob: https:\/\/\*\.supabase\.co/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.doesNotMatch(csp, /unsafe-eval/);
    assert.equal(headers.get("x-content-type-options"), "nosniff");
    assert.equal(headers.get("x-frame-options"), "DENY");
    assert.equal(
      headers.get("referrer-policy"),
      "strict-origin-when-cross-origin"
    );
    assert.equal(
      headers.get("permissions-policy"),
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    assert.equal(headers.get("strict-transport-security"), null);
  });

  test("allows eval only in development for the Next.js development runtime", () => {
    assert.match(buildContentSecurityPolicy(true), /unsafe-eval/);
    assert.doesNotMatch(buildContentSecurityPolicy(false), /unsafe-eval/);
  });

  test("sets HSTS only for production HTTPS responses", () => {
    const productionHttpsHeaders = new Headers();
    applySecurityHeaders(productionHttpsHeaders, {
      isDevelopment: false,
      isProduction: true,
      isHttps: true,
    });
    assert.equal(
      productionHttpsHeaders.get("strict-transport-security"),
      "max-age=31536000"
    );

    for (const options of [
      { isDevelopment: true, isProduction: false, isHttps: false },
      { isDevelopment: false, isProduction: true, isHttps: false },
    ]) {
      const headers = new Headers();
      applySecurityHeaders(headers, options);
      assert.equal(headers.get("strict-transport-security"), null);
    }
  });
});
