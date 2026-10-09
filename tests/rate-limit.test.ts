import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  enforceRateLimits,
  getClientIp,
  type RateLimitCheck,
  type RateLimitEvaluation,
} from "../src/lib/rate-limit";

const allowed: RateLimitEvaluation = {
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 60_000,
};

describe("shared rate-limit responses", () => {
  test("allows requests when all dimensions are within policy", async () => {
    const checks: RateLimitCheck[] = [
      { policy: "customerLoginIp", identifier: "ip:192.0.2.10" },
      { policy: "customerLoginAccount", identifier: "email:user@example.com" },
    ];
    const evaluated: RateLimitCheck[] = [];

    const response = await enforceRateLimits(
      new Request("https://example.test/api/auth/customer/login"),
      checks,
      async (check) => {
        evaluated.push(check);
        return allowed;
      }
    );

    assert.equal(response, null);
    assert.deepEqual(evaluated, checks);
  });

  test("returns 429 and retry headers when any dimension is over limit", async () => {
    const retryReset = Date.now() + 60_000;
    const response = await enforceRateLimits(
      new Request("https://example.test/api/auth/customer/login"),
      [
        { policy: "customerLoginIp", identifier: "ip:192.0.2.10" },
        { policy: "customerLoginAccount", identifier: "email:user@example.com" },
      ],
      async (check) =>
        check.policy === "customerLoginAccount"
          ? {
              success: false,
              limit: 5,
              remaining: 0,
              reset: retryReset,
            }
          : allowed
    );

    assert.equal(response?.status, 429);
    assert.equal(response?.headers.get("Retry-After"), "60");
    assert.equal(response?.headers.get("RateLimit-Limit"), "5");
    assert.equal(response?.headers.get("RateLimit-Remaining"), "0");
    assert.equal(response?.headers.get("Cache-Control"), "no-store");
  });

  test("allows requests when the shared store is not configured", async () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    try {
      const response = await enforceRateLimits(
        new Request("https://example.test/api/auth/customer/login"),
        [{ policy: "customerLoginIp", identifier: "ip:192.0.2.10" }]
      );

      assert.equal(response, null);
    } finally {
      if (originalUrl === undefined) {
        delete process.env.UPSTASH_REDIS_REST_URL;
      } else {
        process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      }

      if (originalToken === undefined) {
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
      } else {
        process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      }
    }
  });

  test("fails closed when the shared store errors after configuration", async () => {
    const response = await enforceRateLimits(
      new Request("https://example.test/api/orders"),
      [{ policy: "checkoutCustomer", identifier: "customer:123" }],
      async () => {
        throw new Error("Redis unavailable");
      }
    );

    assert.equal(response?.status, 503);
    assert.equal(response?.bodyUsed, false);
  });

  test("does not allow test-mode bypass outside the isolated integration harness", async () => {
    const originalTestMode = process.env.RATE_LIMIT_TEST_MODE;
    const originalDistDir = process.env.NEXT_DIST_DIR;
    process.env.RATE_LIMIT_TEST_MODE = "1";
    process.env.NEXT_DIST_DIR = ".next";

    try {
      const response = await enforceRateLimits(
        new Request("https://example.test/api/orders"),
        [{ policy: "checkoutCustomer", identifier: "customer:123" }],
        async () => allowed
      );
      assert.equal(response?.status, 503);
    } finally {
      if (originalTestMode === undefined) {
        delete process.env.RATE_LIMIT_TEST_MODE;
      } else {
        process.env.RATE_LIMIT_TEST_MODE = originalTestMode;
      }
      if (originalDistDir === undefined) delete process.env.NEXT_DIST_DIR;
      else process.env.NEXT_DIST_DIR = originalDistDir;
    }
  });

  test("uses the platform client IP header before forwarded-for", () => {
    const request = new Request("https://example.test", {
      headers: {
        "x-real-ip": "192.0.2.10",
        "x-forwarded-for": "198.51.100.20, 192.0.2.1",
      },
    });
    assert.equal(getClientIp(request), "ip:192.0.2.10");

    const forwardedOnly = new Request("https://example.test", {
      headers: { "x-forwarded-for": "198.51.100.20, 192.0.2.1" },
    });
    assert.equal(getClientIp(forwardedOnly), "ip:198.51.100.20");
  });
});
