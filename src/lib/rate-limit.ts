import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import {
  RATE_LIMIT_POLICIES,
  type RateLimitPolicyName,
} from "@/lib/rate-limit-policies";

export type RateLimitCheck = {
  policy: RateLimitPolicyName;
  identifier: string;
};

export type RateLimitEvaluation = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type RateLimitEvaluator = (
  check: RateLimitCheck
) => Promise<RateLimitEvaluation>;

const limiters = new Map<RateLimitPolicyName, Ratelimit>();
let redis: Redis | undefined;

function hasRedisConfig(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return Boolean(url && token);
}

function getClient(): Redis | undefined {
  if (!hasRedisConfig()) return undefined;

  const url = process.env.UPSTASH_REDIS_REST_URL!.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();

  redis ??= new Redis({ url, token });
  return redis;
}

function getLimiter(policy: RateLimitPolicyName): Ratelimit {
  const existing = limiters.get(policy);
  if (existing) return existing;

  const client = getClient();
  if (!client) {
    throw new Error("Upstash Redis rate-limit configuration is missing.");
  }

  const config = RATE_LIMIT_POLICIES[policy];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: `primezora:rate-limit:${policy}`,
    analytics: false,
    enableTelemetry: false,
  });
  limiters.set(policy, limiter);
  return limiter;
}

async function evaluateWithRedis(
  check: RateLimitCheck
): Promise<RateLimitEvaluation> {
  if (!hasRedisConfig()) {
    logger.info(
      `Rate limiting skipped for ${check.policy} because Upstash Redis is not configured.`
    );
    return {
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: Date.now() + 60_000,
    };
  }

  const identifierHash = createHash("sha256")
    .update(check.identifier)
    .digest("hex");
  const result = await getLimiter(check.policy).limit(identifierHash);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp.slice(0, 128)}`;

  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return `ip:${forwardedIp ? forwardedIp.slice(0, 128) : "unknown"}`;
}

export async function getEmailRateLimitIdentifier(
  request: Request
): Promise<string | undefined> {
  const body: unknown = await request
    .clone()
    .json()
    .catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return undefined;
  }

  const email = (body as Record<string, unknown>).email;
  if (typeof email !== "string") return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail && normalizedEmail.length <= 254
    ? `email:${normalizedEmail}`
    : undefined;
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: "Request protection is temporarily unavailable." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

export async function enforceRateLimits(
  request: Request,
  checks: readonly RateLimitCheck[],
  evaluator: RateLimitEvaluator = evaluateWithRedis
): Promise<NextResponse | null> {
  const testModeRequested = process.env.RATE_LIMIT_TEST_MODE === "1";
  const isIntegrationHarness =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_DIST_DIR?.startsWith(".next-integration-") === true;

  if (testModeRequested) {
    if (!isIntegrationHarness) {
      logger.error(
        "Rate-limit test mode was requested outside the isolated integration harness."
      );
      return unavailableResponse();
    }
    return null;
  }

  if (evaluator === evaluateWithRedis && !hasRedisConfig()) {
    logger.info(
      "Shared rate limiting is disabled because Upstash Redis credentials are not configured."
    );
    return null;
  }

  try {
    const results = await Promise.all(checks.map((check) => evaluator(check)));
    const rejected = results.filter((result) => !result.success);
    if (rejected.length === 0) return null;

    const resetAt = Math.max(...rejected.map((result) => result.reset));
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    const limit = Math.min(...rejected.map((result) => result.limit));
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(retryAfter),
          "RateLimit-Limit": String(limit),
          "RateLimit-Remaining": "0",
          "RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  } catch (error) {
    logger.warn(
      "Shared rate limiter is unavailable; allowing the request to continue without throttling.",
      error
    );
    return null;
  }
}
