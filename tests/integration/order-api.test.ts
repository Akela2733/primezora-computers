import assert from "node:assert/strict";
import {
  spawn,
  type ChildProcessByStdio,
} from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import type { Readable } from "node:stream";
import { after, before, describe, test } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { parse } from "dotenv";

import prismaTestConfig from "../../prisma.test.config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "../../src/lib/admin-session";
import { handleCustomerLogin } from "../../src/lib/customer-login";
import { requestCustomerLogout } from "../../src/lib/customer-logout-client";
import { handleCustomerRegistration } from "../../src/lib/customer-registration";
import { CUSTOMER_PROFILE_FIELD_MAX_LENGTHS } from "../../src/lib/customer-profile-validation";
import { INPUT_LIMITS } from "../../src/lib/input-limits";
import {
  CustomerSessionUnavailableError,
  resolveCustomerApiSession,
  resolveCustomerPageSession,
  resolveCustomerSession,
} from "../../src/lib/customer-session-authorization";
import {
  CATEGORY_CONFIG,
  getCategoryHref,
  getHeaderCategories,
  getSupportedCategories,
} from "../../src/lib/categories";
import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
} from "../../src/lib/customer-session";

const projectRoot = resolve(process.cwd());
const testEnv = parse(readFileSync(resolve(projectRoot, ".env.test.local")));
const testDatabaseUrl = testEnv.DATABASE_URL_TEST?.trim();
const directTestDatabaseUrl = testEnv.DIRECT_DATABASE_URL_TEST?.trim();

if (!testDatabaseUrl || !directTestDatabaseUrl) {
  throw new Error(
    "DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST are required in .env.test.local."
  );
}

if (prismaTestConfig.datasource?.url !== directTestDatabaseUrl) {
  throw new Error(
    "The integration suite must use the datasource URL from prisma.test.config.ts."
  );
}

const runId = randomUUID();
const testDistDir = `.next-integration-${runId}`;
const adminEmail = `admin-${runId}@test.primezora.invalid`;
const adminSessionSecret = randomBytes(48).toString("base64url");
const customerSessionSecret = randomBytes(48).toString("base64url");
const databaseUrlSentinel = "integration-test-disabled-database-url";
const adminCookieName = ADMIN_SESSION_COOKIE;
const customerCookieName = CUSTOMER_SESSION_COOKIE;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: directTestDatabaseUrl }),
});

type Fixture = {
  customerA: {
    id: string;
    email: string;
  };
  customerB: {
    id: string;
    email: string;
  };
  productId: string;
  stockRestoreProductId: string;
  idempotencyProductId: string;
  orderId?: string;
  stockRestoreOrderId?: string;
  customerAToken: string;
  customerBToken: string;
  adminToken: string;
};

let fixture: Fixture | undefined;
let serverProcess:
  | ChildProcessByStdio<null, Readable, Readable>
  | undefined;
let serverOutput = "";
let baseUrl = "";
let testDistDirCreated = false;
const createdCustomers: { id: string; email: string }[] = [];
let createdProduct: { id: string; slug: string } | undefined;
let createdStockRestoreProduct: { id: string; slug: string } | undefined;
let createdIdempotencyProduct: { id: string; slug: string } | undefined;
let createdOrderId: string | undefined;
let createdStockRestoreOrderId: string | undefined;
const createdIdentityOrderIds: string[] = [];
const createdIdempotentOrderIds: string[] = [];

function buildServerEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "development" };
  const inheritedKeys = [
    "PATH",
    "Path",
    "SystemRoot",
    "WINDIR",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "PATHEXT",
    "ComSpec",
  ];

  for (const wantedKey of inheritedKeys) {
    const actualKey = Object.keys(process.env).find(
      (key) => key.toLowerCase() === wantedKey.toLowerCase()
    );
    if (actualKey && process.env[actualKey]) {
      env[actualKey] = process.env[actualKey];
    }
  }

  env.PATH ??= env.Path ?? "";

  for (const fileName of [
    ".env",
    ".env.local",
    ".env.development",
    ".env.development.local",
  ]) {
    try {
      const localValues = parse(
        readFileSync(resolve(projectRoot, fileName))
      );
      for (const key of Object.keys(localValues)) {
        env[key] = `integration-test-disabled-${key}`;
      }
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }
  }

  Object.assign(env, {
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    DIRECT_DATABASE_URL: databaseUrlSentinel,
    DATABASE_URL: directTestDatabaseUrl,
    DIRECT_URL: databaseUrlSentinel,
    DATABASE_URL_TEST: testDatabaseUrl,
    DIRECT_DATABASE_URL_TEST: directTestDatabaseUrl,
    NEXT_DIST_DIR: testDistDir,
    RATE_LIMIT_TEST_MODE: "1",
    ADMIN_EMAIL: adminEmail,
    ADMIN_SESSION_SECRET: adminSessionSecret,
    CUSTOMER_SESSION_SECRET: customerSessionSecret,
    RESEND_API_KEY: " ",
  });

  return env;
}

async function getAvailablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((resolveListen, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolveListen);
  });

  const address = listener.address();
  if (!address || typeof address === "string") {
    listener.close();
    throw new Error("Could not allocate a local integration-test port.");
  }

  await new Promise<void>((resolveClose, reject) => {
    listener.close((error) => (error ? reject(error) : resolveClose()));
  });
  return address.port;
}

function redactTestDatabaseUrl(value: string): string {
  return value
    .replaceAll(directTestDatabaseUrl, "[TEST_DATABASE_URL_REDACTED]")
    .replaceAll(testDatabaseUrl, "[TEST_DATABASE_URL_REDACTED]");
}

async function waitForServer(): Promise<void> {
  const timeoutAt = Date.now() + 180_000;

  while (Date.now() < timeoutAt) {
    if (!serverProcess || serverProcess.exitCode !== null) {
      throw new Error(
        `Next.js test server exited before becoming ready.\n${redactTestDatabaseUrl(serverOutput)}`
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/customer/orders`, {
        signal: AbortSignal.timeout(3_000),
      });
      if (response.status === 401) return;
    } catch {
      // The development server can briefly refuse connections during startup.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error(
    `Next.js test server did not become ready.\n${redactTestDatabaseUrl(serverOutput)}`
  );
}

function cookie(name: string, token: string): string {
  return `${name}=${token}`;
}

function customerHeaders(token: string): HeadersInit {
  return { cookie: cookie(customerCookieName, token) };
}

function adminHeaders(token: string): HeadersInit {
  return { cookie: cookie(adminCookieName, token) };
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function checkoutBody(
  customerEmail: string,
  productId: string,
  quantity: number
) {
  return {
    customer: {
      firstName: "TEST ONLY Customer",
      lastName: customerEmail.includes("customer-b") ? "B" : "A",
      phone: customerEmail.includes("customer-b")
        ? "TEST-ONLY-B"
        : "TEST-ONLY-A",
      email: customerEmail,
      address: "",
      city: "",
      district: "",
      postalCode: "",
    },
    items: [{ productId, quantity }],
    deliveryMethod: "pickup",
    paymentMethod: "cod",
  };
}

async function submitCheckout(
  token: string,
  key: string,
  body: ReturnType<typeof checkoutBody>
): Promise<Response> {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      ...customerHeaders(token),
      "content-type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 201) {
    const payload = (await response.clone().json()) as {
      order?: { id?: unknown };
    };
    if (typeof payload.order?.id === "string") {
      createdIdempotentOrderIds.push(payload.order.id);
    }
  }

  return response;
}

function loginAsIdentity(email: string, authUserId: string): Promise<Response> {
  return handleCustomerLogin(
    new Request("http://localhost/api/auth/customer/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "TEST_ONLY_LOGIN_SECRET",
      }),
    }),
    {
      db: prisma,
      authenticate: async () => ({
        success: true,
        user: {
          id: authUserId,
          user_metadata: {
            firstName: "TEST ONLY",
            lastName: "Identity",
          },
        },
      }),
      issueSession: async () => {},
    }
  );
}

function registrationRequest(email: string): Request {
  return new Request("http://localhost/api/auth/customer/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstName: "TEST ONLY",
      lastName: "Registration",
      email,
      password: "TEST_ONLY_REGISTRATION_SECRET",
      confirmPassword: "TEST_ONLY_REGISTRATION_SECRET",
      next: "/account",
    }),
  });
}

describe("isolated order API integration", { concurrency: false }, () => {
  before(async () => {
    if (testDatabaseUrl === databaseUrlSentinel) {
      throw new Error("The TEST database URL was not loaded from test configuration.");
    }

    process.env.DIRECT_DATABASE_URL = databaseUrlSentinel;
    process.env.DATABASE_URL = directTestDatabaseUrl;
    process.env.DIRECT_URL = databaseUrlSentinel;
    process.env.ADMIN_EMAIL = adminEmail;
    process.env.ADMIN_SESSION_SECRET = adminSessionSecret;
    process.env.CUSTOMER_SESSION_SECRET = customerSessionSecret;

    if (existsSync(resolve(projectRoot, testDistDir))) {
      throw new Error("The unique integration-test build directory already exists.");
    }

    const customerAAuthUserId = `TEST_ONLY_A_${runId}`;
    const customerBAuthUserId = `TEST_ONLY_B_${runId}`;
    const customerAEmail = `customer-a-${runId}@test.primezora.invalid`;
    const customerBEmail = `customer-b-${runId}@test.primezora.invalid`;

    const customerA = await prisma.customer.create({
      data: {
        name: `TEST ONLY Customer A ${runId}`,
        firstName: "TEST ONLY Customer",
        lastName: "A",
        email: customerAEmail,
        authUserId: customerAAuthUserId,
        emailVerified: true,
        phone: "TEST-ONLY-A",
      },
      select: { id: true, authUserId: true, email: true },
    });
    createdCustomers.push({ id: customerA.id, email: customerA.email });
    const customerB = await prisma.customer.create({
      data: {
        name: `TEST ONLY Customer B ${runId}`,
        firstName: "TEST ONLY Customer",
        lastName: "B",
        email: customerBEmail,
        authUserId: customerBAuthUserId,
        emailVerified: true,
        phone: "TEST-ONLY-B",
      },
      select: { id: true, authUserId: true, email: true },
    });
    if (
      customerA.authUserId !== customerAAuthUserId ||
      customerB.authUserId !== customerBAuthUserId
    ) {
      throw new Error("TEST customer auth fixture IDs were not persisted.");
    }
    createdCustomers.push({ id: customerB.id, email: customerB.email });
    const productSlug = `test-only-order-api-${runId}`;
    const product = await prisma.product.create({
      data: {
        name: `TEST ONLY Order API Product ${runId}`,
        slug: productSlug,
        brand: "TEST ONLY",
        category: "PC Components",
        description: "Integration-test fixture; safe to remove.",
        price: 1_000,
        image: "/test-only/order-api-fixture.png",
        inStock: true,
        stockQuantity: 10,
      },
      select: { id: true },
    });
    createdProduct = { id: product.id, slug: productSlug };

    const stockRestoreProductSlug = `test-only-stock-restore-${runId}`;
    const stockRestoreProduct = await prisma.product.create({
      data: {
        name: `TEST ONLY Stock Restore Product ${runId}`,
        slug: stockRestoreProductSlug,
        brand: "TEST ONLY",
        category: "TEST ONLY",
        description: "Integration-test fixture; safe to remove.",
        price: 1_000,
        image: "/test-only/stock-restore-fixture.png",
        inStock: true,
        stockQuantity: 1,
      },
      select: { id: true },
    });
    createdStockRestoreProduct = {
      id: stockRestoreProduct.id,
      slug: stockRestoreProductSlug,
    };

    const idempotencyProductSlug = `test-only-idempotency-${runId}`;
    const idempotencyProduct = await prisma.product.create({
      data: {
        name: `TEST ONLY Idempotency Product ${runId}`,
        slug: idempotencyProductSlug,
        brand: "TEST ONLY",
        category: "TEST ONLY",
        description: "Integration-test fixture; safe to remove.",
        price: 1_000,
        image: "/test-only/idempotency-fixture.png",
        inStock: true,
        stockQuantity: 100,
      },
      select: { id: true },
    });
    createdIdempotencyProduct = {
      id: idempotencyProduct.id,
      slug: idempotencyProductSlug,
    };

    fixture = {
      customerA: { id: customerA.id, email: customerA.email },
      customerB: { id: customerB.id, email: customerB.email },
      productId: product.id,
      stockRestoreProductId: stockRestoreProduct.id,
      idempotencyProductId: idempotencyProduct.id,
      customerAToken: await createCustomerSessionToken(
        customerA.id,
        customerAAuthUserId,
        customerA.email
      ),
      customerBToken: await createCustomerSessionToken(
        customerB.id,
        customerBAuthUserId,
        customerB.email
      ),
      adminToken: await createAdminSessionToken(adminEmail),
    };

    const port = await getAvailablePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const child = spawn(
      process.execPath,
      [
        resolve(projectRoot, "node_modules/next/dist/bin/next"),
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
        "--webpack",
      ],
      {
        cwd: projectRoot,
        env: buildServerEnvironment(),
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    serverProcess = child;
    testDistDirCreated = true;

    const keepRecentOutput = (chunk: Buffer) => {
      serverOutput = `${serverOutput}${chunk.toString()}`.slice(-12_000);
    };
    child.stdout.on("data", keepRecentOutput);
    child.stderr.on("data", keepRecentOutput);
    await waitForServer();
  });

  after(async () => {
    try {
      if (createdIdentityOrderIds.length > 0) {
        await prisma.order.deleteMany({
          where: { id: { in: createdIdentityOrderIds } },
        });
        assert.equal(
          await prisma.order.count({
            where: { id: { in: createdIdentityOrderIds } },
          }),
          0,
          "The TEST identity-link order fixture was not cleaned up."
        );
      }

      if (createdOrderId && createdCustomers[0]) {
        await prisma.order.deleteMany({
          where: {
            id: createdOrderId,
            customerId: createdCustomers[0].id,
            customerEmail: createdCustomers[0].email,
          },
        });
      }

      if (createdStockRestoreOrderId && createdCustomers[0]) {
        await prisma.order.deleteMany({
          where: {
            id: createdStockRestoreOrderId,
            customerId: createdCustomers[0].id,
            customerEmail: createdCustomers[0].email,
          },
        });
      }

      if (createdIdempotentOrderIds.length > 0) {
        const idempotentOrderIds = [...new Set(createdIdempotentOrderIds)];
        await prisma.order.deleteMany({
          where: {
            id: { in: idempotentOrderIds },
            customerId: { in: createdCustomers.map((customer) => customer.id) },
          },
        });
        assert.equal(
          await prisma.order.count({ where: { id: { in: idempotentOrderIds } } }),
          0,
          "The TEST idempotency order fixtures were not cleaned up."
        );
      }

      if (createdCustomers.length > 0) {
        await prisma.customer.deleteMany({
          where: {
            id: { in: createdCustomers.map((customer) => customer.id) },
            email: { in: createdCustomers.map((customer) => customer.email) },
          },
        });
      }

      if (createdProduct) {
        await prisma.product.deleteMany({
          where: {
            id: createdProduct.id,
            slug: createdProduct.slug,
          },
        });
      }

      if (createdStockRestoreProduct) {
        await prisma.product.deleteMany({
          where: {
            id: createdStockRestoreProduct.id,
            slug: createdStockRestoreProduct.slug,
          },
        });
      }

      if (createdIdempotencyProduct) {
        await prisma.product.deleteMany({
          where: {
            id: createdIdempotencyProduct.id,
            slug: createdIdempotencyProduct.slug,
          },
        });
      }

      if (createdOrderId && createdCustomers[0]) {
        assert.equal(
          await prisma.order.count({
            where: {
              id: createdOrderId,
              customerId: createdCustomers[0].id,
              customerEmail: createdCustomers[0].email,
            },
          }),
          0,
          "The TEST order fixture was not cleaned up."
        );
      }
      if (createdStockRestoreOrderId && createdCustomers[0]) {
        assert.equal(
          await prisma.order.count({
            where: {
              id: createdStockRestoreOrderId,
              customerId: createdCustomers[0].id,
              customerEmail: createdCustomers[0].email,
            },
          }),
          0,
          "The TEST stock-restore order fixture was not cleaned up."
        );
      }
      if (createdCustomers.length > 0) {
        assert.equal(
          await prisma.customer.count({
            where: {
              id: { in: createdCustomers.map((customer) => customer.id) },
              email: { in: createdCustomers.map((customer) => customer.email) },
            },
          }),
          0,
          "The TEST customer fixtures were not cleaned up."
        );
      }
      if (createdProduct) {
        assert.equal(
          await prisma.product.count({
            where: {
              id: createdProduct.id,
              slug: createdProduct.slug,
            },
          }),
          0,
          "The TEST product fixture was not cleaned up."
        );
      }
      if (createdStockRestoreProduct) {
        assert.equal(
          await prisma.product.count({
            where: {
              id: createdStockRestoreProduct.id,
              slug: createdStockRestoreProduct.slug,
            },
          }),
          0,
          "The TEST stock-restore product fixture was not cleaned up."
        );
      }
      if (createdIdempotencyProduct) {
        assert.equal(
          await prisma.product.count({
            where: {
              id: createdIdempotencyProduct.id,
              slug: createdIdempotencyProduct.slug,
            },
          }),
          0,
          "The TEST idempotency product fixture was not cleaned up."
        );
      }
    } finally {
      if (serverProcess && serverProcess.exitCode === null) {
        const child = serverProcess;
        await new Promise<void>((resolveExit) => {
          child.once("exit", () => resolveExit());
          child.kill("SIGINT");
          const killTimeout = setTimeout(() => {
            if (child.exitCode === null) child.kill("SIGKILL");
            resolveExit();
          }, 10_000);
          killTimeout.unref();
        });
      }

      try {
        await prisma.$disconnect();
      } finally {
        if (testDistDirCreated) {
          await rm(resolve(projectRoot, testDistDir), {
            recursive: true,
            force: true,
          });
        }
      }
    }
  });

  test("unauthenticated customer order list returns 401", async () => {
    const response = await fetch(`${baseUrl}/api/customer/orders`);
    assert.equal(response.status, 401);
  });

  test("invalid customer sessions preserve 401 authentication behavior", async () => {
    const response = await fetch(`${baseUrl}/api/customer/profile`, {
      headers: {
        cookie: cookie(customerCookieName, "invalid-session-token"),
      },
    });
    assert.equal(response.status, 401);
    const body = await response.text();
    assert.doesNotMatch(body, /database|prisma|connection|session-token/i);
  });

  test("valid customer sessions retain protected API access", async () => {
    const currentFixture = fixture!;
    const response = await fetch(`${baseUrl}/api/customer/profile`, {
      headers: customerHeaders(currentFixture.customerAToken),
    });
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    assert.equal(payload.customer && typeof payload.customer, "object");
  });

  test("database session lookup failure becomes a generic service error, not 401", async () => {
    const sentinelDetails =
      "TEST_ONLY_DATABASE_SECRET_SESSION_AUTH_INTERNAL";
    const resolveSession = () =>
      resolveCustomerSession(
        {
          customerId: fixture!.customerA.id,
          authUserId: "TEST_ONLY_A_",
        },
        async () => {
          throw new Error(sentinelDetails);
        }
      );

    await assert.rejects(
      resolveSession(),
      CustomerSessionUnavailableError
    );
    const result = await resolveCustomerApiSession(resolveSession);
    assert.equal(result.session, null);
    assert.equal(result.response?.status, 503);
    const body = await result.response!.text();
    assert.equal(
      body,
      JSON.stringify({
        error: "Authentication service temporarily unavailable.",
      })
    );
    for (const internalValue of [
      sentinelDetails,
      fixture!.customerAToken,
      fixture!.customerA.id,
      "TEST_ONLY_A_",
      directTestDatabaseUrl,
    ]) {
      assert.ok(
        !body.includes(internalValue),
        "Authentication failure response exposed an internal value."
      );
    }
  });

  test("protected page lookup failures propagate instead of redirecting to login", async () => {
    const failure = new CustomerSessionUnavailableError();
    await assert.rejects(
      resolveCustomerPageSession(
        async () => {
          throw failure;
        },
        () => {
          throw new Error("Unexpected login redirect");
        }
      ),
      (error: unknown) => error === failure
    );

    await assert.rejects(
      resolveCustomerPageSession(
        async () => null,
        () => {
          throw new Error("LOGIN_REDIRECT");
        }
      ),
      /LOGIN_REDIRECT/
    );

    assert.equal(
      await resolveCustomerPageSession(async () => "authenticated", () => {
        throw new Error("Unexpected login redirect");
      }),
      "authenticated"
    );
  });

  test("unauthenticated admin order list returns 401", async () => {
    const response = await fetch(`${baseUrl}/api/admin/orders`);
    assert.equal(response.status, 401);
  });

  test("GET customer logout does not clear the session", async () => {
    const currentFixture = fixture!;
    const logoutResponse = await fetch(
      `${baseUrl}/api/auth/customer/logout`,
      {
        method: "GET",
        headers: { cookie: cookie(customerCookieName, currentFixture.customerAToken) },
        redirect: "manual",
      }
    );
    assert.equal(logoutResponse.status, 405);
    assert.equal(logoutResponse.headers.has("set-cookie"), false);

    const protectedResponse = await fetch(`${baseUrl}/api/customer/orders`, {
      headers: customerHeaders(currentFixture.customerAToken),
    });
    assert.equal(protectedResponse.status, 200);
  });

  test("customer logout POST enforces origin and clears the session", async () => {
    const currentFixture = fixture!;
    const cookieHeader = cookie(
      customerCookieName,
      currentFixture.customerAToken
    );
    const rejectedResponse = await fetch(
      `${baseUrl}/api/auth/customer/logout`,
      {
        method: "POST",
        headers: {
          cookie: cookieHeader,
          origin: "https://attacker.invalid",
        },
      }
    );
    assert.equal(rejectedResponse.status, 403);

    const stillAuthenticatedResponse = await fetch(
      `${baseUrl}/api/customer/orders`,
      {
        headers: customerHeaders(currentFixture.customerAToken),
      }
    );
    assert.equal(stillAuthenticatedResponse.status, 200);

    const logoutResponse = await fetch(
      `${baseUrl}/api/auth/customer/logout`,
      {
        method: "POST",
        headers: {
          cookie: cookieHeader,
          origin: `http://localhost:${new URL(baseUrl).port}`,
        },
      }
    );
    assert.equal(logoutResponse.status, 200);
    assert.deepEqual(await responseJson(logoutResponse), {
      success: true,
      redirectUrl: "/login",
    });
    assert.match(
      logoutResponse.headers.get("set-cookie") ?? "",
      new RegExp(`^${customerCookieName}=;.*max-age=0`, "i")
    );

    const unauthenticatedResponse = await fetch(
      `${baseUrl}/api/customer/orders`
    );
    assert.equal(unauthenticatedResponse.status, 401);
  });

  test("customer logout client rejects failed or unexpected responses", async () => {
    let requestMethod: string | undefined;
    await requestCustomerLogout(async (_input, init) => {
      requestMethod = init?.method;
      return new Response(
        JSON.stringify({ success: true, redirectUrl: "/login" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    assert.equal(requestMethod, "POST");

    await assert.rejects(
      requestCustomerLogout(
        async () =>
          new Response(JSON.stringify({ error: "Failed to log out." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          })
      ),
      /Customer logout request failed/
    );
    await assert.rejects(
      requestCustomerLogout(
        async () =>
          new Response(JSON.stringify({ success: false }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
      ),
      /Customer logout response was invalid/
    );
  });

  test("customer profile PATCH enforces length limits and preserves ownership", async () => {
    const profileAuthUserId = `TEST_ONLY_PROFILE_${runId}`;
    const profileEmail = `profile-validation-${runId}@test.primezora.invalid`;
    const profileCustomer = await prisma.customer.create({
      data: {
        email: profileEmail,
        authUserId: profileAuthUserId,
        emailVerified: true,
        firstName: "Original",
        lastName: "Customer",
        name: "Original Customer",
        phone: "0771234567",
        address: "1 Original Road",
        city: "Original City",
        province: "Original Province",
        postalCode: "10000",
      },
      select: { id: true, email: true },
    });
    createdCustomers.push({
      id: profileCustomer.id,
      email: profileCustomer.email,
    });

    const profileOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-${runId}-PROFILE-VALIDATION`,
        customerId: profileCustomer.id,
        customerName: "Original Customer",
        customerEmail: profileEmail,
        deliveryMethod: "pickup",
        subtotal: 1_000,
        deliveryFee: 0,
        total: 1_000,
        paymentMethod: "cod",
      },
      select: { id: true, customerId: true },
    });
    createdIdentityOrderIds.push(profileOrder.id);

    const profileToken = await createCustomerSessionToken(
      profileCustomer.id,
      profileAuthUserId,
      profileEmail
    );
    const patchProfile = (
      body: Record<string, unknown>,
      token?: string
    ) =>
      fetch(`${baseUrl}/api/customer/profile`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...(token ? customerHeaders(token) : {}),
        },
        body: JSON.stringify(body),
      });
    const readStoredProfile = () =>
      prisma.customer.findUniqueOrThrow({
        where: { id: profileCustomer.id },
        select: {
          id: true,
          email: true,
          authUserId: true,
          firstName: true,
          lastName: true,
          name: true,
          phone: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
        },
      });

    const unauthenticatedResponse = await patchProfile({ city: "Unauthenticated" });
    assert.equal(unauthenticatedResponse.status, 401);

    const normalizedResponse = await patchProfile(
      {
        firstName: "  Ada  ",
        lastName: "  Lovelace  ",
        phone: "  +94 77 123 4567  ",
        address: "  42 Galle Road  ",
        city: "  Colombo  ",
        province: "  Western Province  ",
        postalCode: "  10250  ",
      },
      profileToken
    );
    assert.equal(normalizedResponse.status, 200);
    const normalized = await responseJson(normalizedResponse);
    assert.equal(normalized.success, true);
    assert.deepEqual(normalized.customer, {
      id: profileCustomer.id,
      email: profileEmail,
      firstName: "Ada",
      lastName: "Lovelace",
      name: "Ada Lovelace",
      phone: "+94 77 123 4567",
      address: "42 Galle Road",
      city: "Colombo",
      province: "Western Province",
      postalCode: "10250",
      updatedAt: (normalized.customer as { updatedAt: unknown }).updatedAt,
    });

    const fieldEntries = Object.entries(
      CUSTOMER_PROFILE_FIELD_MAX_LENGTHS
    ) as [keyof typeof CUSTOMER_PROFILE_FIELD_MAX_LENGTHS, number][];
    const boundaryValues = Object.fromEntries(
      fieldEntries.map(([field, maxLength]) => [
        field,
        field === "firstName" || field === "lastName"
          ? "N".repeat(maxLength)
          : "X".repeat(maxLength),
      ])
    );
    const boundaryResponse = await patchProfile(boundaryValues, profileToken);
    assert.equal(boundaryResponse.status, 200);
    const boundaryCustomer = await readStoredProfile();
    for (const [field, maxLength] of fieldEntries) {
      assert.equal(boundaryCustomer[field]?.length, maxLength);
      assert.equal(boundaryCustomer[field], boundaryValues[field]);
    }
    assert.equal(
      boundaryCustomer.name,
      `${"N".repeat(CUSTOMER_PROFILE_FIELD_MAX_LENGTHS.firstName)} ${"N".repeat(CUSTOMER_PROFILE_FIELD_MAX_LENGTHS.lastName)}`
    );

    for (const [field, maxLength] of fieldEntries) {
      const beforeInvalidUpdate = await readStoredProfile();
      const tooLongValue = "X".repeat(maxLength + 1);
      const invalidResponse = await patchProfile(
        {
          city: "Must Not Partially Update",
          [field]: tooLongValue,
        },
        profileToken
      );
      assert.equal(invalidResponse.status, 400, `${field} should reject over-limit values`);
      const invalidBody = await responseJson(invalidResponse);
      assert.equal(
        invalidBody.error,
        `Field "${field}" cannot exceed ${maxLength} characters.`
      );
      const afterInvalidUpdate = await readStoredProfile();
      assert.deepEqual(afterInvalidUpdate, beforeInvalidUpdate);
      assert.notEqual(afterInvalidUpdate[field], tooLongValue);
    }

    const beforeClearingNames = await readStoredProfile();
    const clearNamesResponse = await patchProfile(
      { firstName: null, lastName: null },
      profileToken
    );
    assert.equal(clearNamesResponse.status, 400);
    assert.match(
      String((await responseJson(clearNamesResponse)).error),
      /First name cannot be empty/
    );
    assert.deepEqual(await readStoredProfile(), beforeClearingNames);

    const customerBBefore = await prisma.customer.findUniqueOrThrow({
      where: { id: fixture!.customerB.id },
      select: { firstName: true, lastName: true, name: true, city: true },
    });
    const crossCustomerResponse = await patchProfile(
      {
        customerId: profileCustomer.id,
        city: "Attempted cross-customer update",
      },
      fixture!.customerBToken
    );
    assert.equal(crossCustomerResponse.status, 400);
    assert.deepEqual(
      await prisma.customer.findUniqueOrThrow({
        where: { id: fixture!.customerB.id },
        select: { firstName: true, lastName: true, name: true, city: true },
      }),
      customerBBefore
    );
    assert.deepEqual(await readStoredProfile(), beforeClearingNames);

    const storedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: profileOrder.id },
      select: { customerId: true },
    });
    assert.equal(storedOrder.customerId, profileCustomer.id);
  });

  test("an unlinked customer profile can be linked to the authenticated identity", async () => {
    const authUserId = `TEST_ONLY_UNLINKED_${runId}`;
    const email = `unlinked-${runId}@test.primezora.invalid`;
    const customer = await prisma.customer.create({
      data: {
        email,
        name: "TEST ONLY Unlinked",
        authUserId: null,
        emailVerified: true,
      },
    });
    createdCustomers.push({ id: customer.id, email });

    const response = await loginAsIdentity(email, authUserId);
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    assert.deepEqual(payload, { success: true, redirectUrl: "/account" });

    const linked = await prisma.customer.findUniqueOrThrow({
      where: { id: customer.id },
      select: { id: true, authUserId: true },
    });
    assert.equal(linked.id, customer.id);
    assert.equal(linked.authUserId, authUserId);
    assert.equal(await prisma.customer.count({ where: { email } }), 1);
  });

  test("an already-linked customer resolves to its existing identity profile", async () => {
    const authUserId = `TEST_ONLY_ALREADY_LINKED_${runId}`;
    const email = `already-linked-${runId}@test.primezora.invalid`;
    const customer = await prisma.customer.create({
      data: {
        email,
        authUserId,
        name: "TEST ONLY Already Linked",
        emailVerified: true,
      },
    });
    createdCustomers.push({ id: customer.id, email });

    const response = await loginAsIdentity(email, authUserId);
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    assert.deepEqual(payload, { success: true, redirectUrl: "/account" });

    const resolved = await prisma.customer.findUniqueOrThrow({
      where: { authUserId },
      select: { id: true },
    });
    assert.equal(resolved.id, customer.id);
    assert.equal(await prisma.customer.count({ where: { email } }), 1);
  });

  test("a conflicting identity cannot link or take ownership of a customer profile or orders", async () => {
    const originalAuthUserId = `TEST_ONLY_ORIGINAL_${runId}`;
    const attemptedAuthUserId = `TEST_ONLY_ATTEMPTED_${runId}`;
    const email = `conflicting-${runId}@test.primezora.invalid`;
    const customer = await prisma.customer.create({
      data: {
        email,
        authUserId: originalAuthUserId,
        name: "TEST ONLY Conflicting Identity",
        emailVerified: true,
      },
    });
    createdCustomers.push({ id: customer.id, email });

    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${runId}-IDENTITY-LINK`,
        customerId: customer.id,
        customerName: "TEST ONLY Conflicting Identity",
        customerEmail: email,
        deliveryMethod: "pickup",
        subtotal: 1_000,
        deliveryFee: 0,
        total: 1_000,
        paymentMethod: "cod",
      },
      select: { id: true, customerId: true },
    });
    createdIdentityOrderIds.push(order.id);

    const response = await loginAsIdentity(email, attemptedAuthUserId);
    assert.equal(response.status, 409);
    const responseBody = await response.text();
    assert.equal(
      responseBody,
      JSON.stringify({
        error: "Unable to link this account. Please contact support.",
      })
    );
    for (const internalValue of [
      originalAuthUserId,
      attemptedAuthUserId,
      customer.id,
      email,
      "TEST_ONLY_LOGIN_SECRET",
    ]) {
      assert.ok(
        !responseBody.includes(internalValue),
        `Login response exposed an internal value: ${internalValue}`
      );
    }

    const [unchangedCustomer, unchangedOrder, emailMatches] = await Promise.all([
      prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
        select: { id: true, authUserId: true },
      }),
      prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        select: { customerId: true },
      }),
      prisma.customer.count({ where: { email } }),
    ]);
    assert.equal(unchangedCustomer.authUserId, originalAuthUserId);
    assert.equal(unchangedOrder.customerId, customer.id);
    assert.equal(order.customerId, customer.id);
    assert.equal(emailMatches, 1);
    assert.equal(
      await prisma.customer.count({ where: { authUserId: attemptedAuthUserId } }),
      0
    );
  });

  test("a new authenticated identity creates a customer profile when none exists", async () => {
    const authUserId = `TEST_ONLY_NEW_IDENTITY_${runId}`;
    const email = `new-identity-${runId}@test.primezora.invalid`;

    const response = await loginAsIdentity(email, authUserId);
    assert.equal(response.status, 403);
    const payload = await responseJson(response);
    assert.equal(payload.requiresEmailConfirmation, true);
    assert.equal(payload.verificationUrl, `/verify-email?email=${encodeURIComponent(email)}&next=%2Faccount`);

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { authUserId },
      select: { id: true, authUserId: true, email: true, emailVerified: true },
    });
    createdCustomers.push({ id: customer.id, email: customer.email });
    assert.equal(customer.authUserId, authUserId);
    assert.equal(customer.email, email);
    assert.equal(customer.emailVerified, false);
    assert.equal(await prisma.customer.count({ where: { email } }), 1);
  });

  test("concurrent logins cannot link an unverified customer before email verification", async () => {
    const email = `concurrent-link-${runId}@test.primezora.invalid`;
    const customer = await prisma.customer.create({
      data: {
        email,
        authUserId: null,
        name: "TEST ONLY Concurrent Link",
      },
    });
    createdCustomers.push({ id: customer.id, email });
    const authUserIds = [
      `TEST_ONLY_CONCURRENT_A_${runId}`,
      `TEST_ONLY_CONCURRENT_B_${runId}`,
    ];

    const responses = await Promise.all(
      authUserIds.map((authUserId) => loginAsIdentity(email, authUserId))
    );
    const statuses = responses.map((response) => response.status).sort();
    assert.deepEqual(statuses, [403, 403]);

    const linkedCustomer = await prisma.customer.findUniqueOrThrow({
      where: { id: customer.id },
      select: { authUserId: true },
    });
    assert.equal(linkedCustomer.authUserId, null);
    assert.equal(await prisma.customer.count({ where: { email } }), 1);
    assert.equal(
      await prisma.customer.count({
        where: { authUserId: { in: authUserIds } },
      }),
      1
    );
  });

  test("registration verifies new accounts and never links duplicate customer accounts", async () => {
    const newAuthUserId = `TEST_ONLY_REGISTERED_${runId}`;
    const newEmail = `new-registration-${runId}@test.primezora.invalid`;
    const newResponse = await handleCustomerRegistration(
      registrationRequest(newEmail),
      {
        db: prisma,
        signUp: async () => ({
          success: true,
          user: { id: newAuthUserId },
          requiresEmailConfirmation: true,
        }),
        sendVerification: async () => {
          return { success: true };
        },
      }
    );
    assert.equal(newResponse.status, 201);
    assert.deepEqual(await responseJson(newResponse), {
      success: true,
      emailAccepted: true,
      requiresSignIn: true,
      requiresEmailConfirmation: true,
      redirectUrl: `/verify-email?email=${encodeURIComponent(newEmail)}&next=%2Faccount`,
    });

    const newCustomer = await prisma.customer.findUniqueOrThrow({
      where: { authUserId: newAuthUserId },
      select: { id: true, email: true, authUserId: true },
    });
    createdCustomers.push({ id: newCustomer.id, email: newCustomer.email });
    assert.equal(await prisma.customer.count({ where: { email: newEmail } }), 1);

    const originalAuthUserId = `TEST_ONLY_EXISTING_REGISTRATION_${runId}`;
    const existingEmail = `existing-registration-${runId}@test.primezora.invalid`;
    const existingCustomer = await prisma.customer.create({
      data: {
        email: existingEmail,
        authUserId: originalAuthUserId,
        name: "TEST ONLY Existing Registration",
      },
      select: { id: true, email: true, authUserId: true },
    });
    createdCustomers.push({
      id: existingCustomer.id,
      email: existingCustomer.email,
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-${runId}-REGISTER-ENUM`,
        customerId: existingCustomer.id,
        customerName: "TEST ONLY Existing Registration",
        customerEmail: existingEmail,
        deliveryMethod: "pickup",
        subtotal: 1_000,
        deliveryFee: 0,
        total: 1_000,
        paymentMethod: "cod",
      },
      select: { id: true, customerId: true },
    });
    createdIdentityOrderIds.push(order.id);

    let providerCalled = false;
    const existingResponse = await handleCustomerRegistration(
      registrationRequest(existingEmail),
      {
        db: prisma,
        signUp: async () => {
          providerCalled = true;
          return {
            success: true,
            user: { id: `TEST_ONLY_SHOULD_NOT_LINK_${runId}` },
            requiresEmailConfirmation: false,
          };
        },
        sendVerification: async (customer) => {
          assert.equal(customer.id, existingCustomer.id);
          return { success: true };
        },
      }
    );
    assert.equal(existingResponse.status, newResponse.status);
    const existingBody = await responseJson(existingResponse);
    assert.deepEqual(existingBody, {
      success: true,
      emailAccepted: true,
      requiresSignIn: true,
      requiresEmailConfirmation: true,
      redirectUrl: `/verify-email?email=${encodeURIComponent(existingEmail)}&next=%2Faccount`,
    });
    assert.equal(providerCalled, false);

    const bodyText = JSON.stringify(existingBody);
    for (const internalValue of [
      originalAuthUserId,
      `TEST_ONLY_SHOULD_NOT_LINK_${runId}`,
      "TEST_ONLY_REGISTRATION_SECRET",
    ]) {
      assert.ok(
        !bodyText.includes(internalValue),
        `Registration response exposed an internal value: ${internalValue}`
      );
    }

    const [unchangedCustomer, unchangedOrder] = await Promise.all([
      prisma.customer.findUniqueOrThrow({
        where: { id: existingCustomer.id },
        select: { id: true, authUserId: true },
      }),
      prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        select: { customerId: true },
      }),
    ]);
    assert.equal(unchangedCustomer.authUserId, originalAuthUserId);
    assert.equal(unchangedOrder.customerId, existingCustomer.id);
    assert.equal(await prisma.customer.count({ where: { email: existingEmail } }), 1);
    assert.equal(
      await prisma.customer.count({
        where: { authUserId: `TEST_ONLY_SHOULD_NOT_LINK_${runId}` },
      }),
      0
    );

    const unlinkedEmail = `unlinked-registration-${runId}@test.primezora.invalid`;
    const unlinkedCustomer = await prisma.customer.create({
      data: {
        email: unlinkedEmail,
        authUserId: null,
        name: "TEST ONLY Unlinked Registration",
      },
      select: { id: true, email: true },
    });
    createdCustomers.push({
      id: unlinkedCustomer.id,
      email: unlinkedCustomer.email,
    });
    const unlinkedOrder = await prisma.order.create({
      data: {
        orderNumber: `TEST-${runId}-REGISTER-UNLINKED`,
        customerId: unlinkedCustomer.id,
        customerName: "TEST ONLY Unlinked Registration",
        customerEmail: unlinkedEmail,
        deliveryMethod: "pickup",
        subtotal: 1_000,
        deliveryFee: 0,
        total: 1_000,
        paymentMethod: "cod",
      },
      select: { id: true, customerId: true },
    });
    createdIdentityOrderIds.push(unlinkedOrder.id);

    let unlinkedProviderCalled = false;
    const unlinkedResponse = await handleCustomerRegistration(
      registrationRequest(unlinkedEmail),
      {
        db: prisma,
        signUp: async () => {
          unlinkedProviderCalled = true;
          return {
            success: true,
            user: { id: `TEST_ONLY_UNLINKED_NEW_AUTH_${runId}` },
            requiresEmailConfirmation: false,
          };
        },
        sendVerification: async () => ({ success: true }),
      }
    );
    assert.equal(unlinkedResponse.status, newResponse.status);
    assert.deepEqual(await responseJson(unlinkedResponse), {
      success: true,
      emailAccepted: true,
      requiresSignIn: true,
      requiresEmailConfirmation: true,
      redirectUrl: `/verify-email?email=${encodeURIComponent(unlinkedEmail)}&next=%2Faccount`,
    });
    assert.equal(unlinkedProviderCalled, false);
    const [stillUnlinkedCustomer, unchangedUnlinkedOrder] = await Promise.all([
      prisma.customer.findUniqueOrThrow({
        where: { id: unlinkedCustomer.id },
        select: { authUserId: true },
      }),
      prisma.order.findUniqueOrThrow({
        where: { id: unlinkedOrder.id },
        select: { customerId: true },
      }),
    ]);
    assert.equal(stillUnlinkedCustomer.authUserId, null);
    assert.equal(unchangedUnlinkedOrder.customerId, unlinkedCustomer.id);
    assert.equal(await prisma.customer.count({ where: { email: unlinkedEmail } }), 1);

    const providerDuplicateEmail = `provider-duplicate-${runId}@test.primezora.invalid`;
    const providerDuplicateResponse = await handleCustomerRegistration(
      registrationRequest(providerDuplicateEmail),
      {
        db: prisma,
        signUp: async () => ({
          success: false,
          emailMayExist: true,
        }),
      }
    );
    assert.equal(providerDuplicateResponse.status, 409);
    assert.match(
      JSON.stringify(await responseJson(providerDuplicateResponse)),
      /account with this email already exists/
    );
    assert.equal(
      await prisma.customer.count({ where: { email: providerDuplicateEmail } }),
      0
    );
  });

  test("unauthenticated checkout shows sign-in and registration before the checkout form", async () => {
    const response = await fetch(`${baseUrl}/checkout`);
    const html = await response.text();
    assert.equal(response.status, 200, html.slice(0, 2_000));
    assert.match(html, /Sign in to continue/);
    assert.match(html, /href="\/login\?next=%2Fcheckout"/);
    assert.match(html, /href="\/register\?next=%2Fcheckout"/);
    assert.doesNotMatch(html, /Complete Your Order/);
    assert.doesNotMatch(html, /Customer Information/);
  });

  test("checkout destination is preserved between login and registration", async () => {
    const loginResponse = await fetch(
      `${baseUrl}/login?next=%2Fcheckout`
    );
    const loginHtml = await loginResponse.text();
    assert.equal(loginResponse.status, 200, loginHtml.slice(0, 2_000));
    assert.match(loginHtml, /href="\/register\?next=%2Fcheckout"/);

    const registerResponse = await fetch(
      `${baseUrl}/register?next=%2Fcheckout`
    );
    const registerHtml = await registerResponse.text();
    assert.equal(registerResponse.status, 200, registerHtml.slice(0, 2_000));
    assert.match(registerHtml, /href="\/login\?next=%2Fcheckout"/);
  });

  test("unauthenticated order submission remains rejected without changing inventory", async () => {
    assert.ok(fixture);
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.productId },
      select: { stockQuantity: true },
    });
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 401);
    const after = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.productId },
      select: { stockQuantity: true },
    });
    assert.equal(after.stockQuantity, before.stockQuantity);
  });

  test("authenticated order submissions require a valid Idempotency-Key", async () => {
    assert.ok(fixture);
    const missingKey = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        ...customerHeaders(fixture.customerAToken),
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert.equal(missingKey.status, 400);

    const invalidKey = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        ...customerHeaders(fixture.customerAToken),
        "content-type": "application/json",
        "Idempotency-Key": "short",
      },
      body: JSON.stringify({}),
    });
    assert.equal(invalidKey.status, 400);
  });

  test("oversized checkout fields return 400 without creating orders or reserving stock", async () => {
    assert.ok(fixture);
    const productId = fixture.idempotencyProductId;
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stockQuantity: true },
    });
    const orderCountBefore = await prisma.order.count({
      where: { customerId: fixture.customerA.id },
    });

    const oversizedCustomerFields = [
      ["firstName", INPUT_LIMITS.customer.firstName],
      ["lastName", INPUT_LIMITS.customer.lastName],
      ["phone", INPUT_LIMITS.customer.phone],
      ["email", INPUT_LIMITS.customer.email],
      ["address", INPUT_LIMITS.customer.address],
      ["city", INPUT_LIMITS.customer.city],
      ["district", INPUT_LIMITS.checkout.district],
      ["postalCode", INPUT_LIMITS.customer.postalCode],
    ] as const;

    for (const [field, maximum] of oversizedCustomerFields) {
      const body = checkoutBody(
        fixture.customerA.email,
        productId,
        1
      );
      body.customer[field] =
        field === "email"
          ? `${"a".repeat(maximum - 5)}@x.com`
          : "x".repeat(maximum + 1);

      const response = await submitCheckout(
        fixture.customerAToken,
        randomUUID(),
        body
      );
      assert.equal(response.status, 400, `${field} should be rejected`);
    }

    const oversizedProductIdBody = checkoutBody(
      fixture.customerA.email,
      productId,
      1
    );
    oversizedProductIdBody.items[0].productId = "x".repeat(
      INPUT_LIMITS.checkout.productId + 1
    );
    const productIdResponse = await submitCheckout(
      fixture.customerAToken,
      randomUUID(),
      oversizedProductIdBody
    );
    assert.equal(productIdResponse.status, 400);

    const [after, orderCountAfter] = await Promise.all([
      prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: { stockQuantity: true },
      }),
      prisma.order.count({
        where: { customerId: fixture.customerA.id },
      }),
    ]);
    assert.equal(after.stockQuantity, before.stockQuantity);
    assert.equal(orderCountAfter, orderCountBefore);
  });

  test("admin product writes reject every oversized text field", async () => {
    assert.ok(fixture);
    const fields = [
      ["name", INPUT_LIMITS.product.name],
      ["slug", INPUT_LIMITS.product.slug],
      ["brand", INPUT_LIMITS.product.brand],
      ["category", INPUT_LIMITS.product.category],
      ["description", INPUT_LIMITS.product.description],
      ["image", INPUT_LIMITS.product.image],
      ["badge", INPUT_LIMITS.product.badge],
    ] as const;

    for (const [field, maximum] of fields) {
      const body: Record<string, unknown> = {
        name: "TEST ONLY Input Limit Product",
        slug: `test-only-input-limit-${field}-${runId}`,
        brand: "TEST ONLY",
        category: "TEST ONLY",
        description: "TEST ONLY",
        price: 1,
        image: "/test-only/input-limit.png",
        badge: "TEST",
        stockQuantity: 1,
        [field]: "x".repeat(maximum + 1),
      };
      const response: Response = await fetch(`${baseUrl}/api/admin/products`, {
        method: "POST",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400, `${field} should be rejected`);
    }
  });

  test("catalog and admin product search parameters reject oversized values", async () => {
    assert.ok(fixture);
    const defaultCatalog = await fetch(`${baseUrl}/api/products`);
    assert.equal(defaultCatalog.status, 200);
    const defaultCatalogPayload = await responseJson(defaultCatalog);
    const defaultCatalogProducts =
      defaultCatalogPayload.products as unknown[];
    const defaultCatalogPagination =
      defaultCatalogPayload.pagination as {
        page: number;
        limit: number;
      };
    assert.equal(defaultCatalogPagination.page, 1);
    assert.equal(defaultCatalogPagination.limit, 24);
    assert.ok(defaultCatalogProducts.length <= 24);

    for (const limit of [1, 100]) {
      const response: Response = await fetch(
        `${baseUrl}/api/products?page=1&limit=${limit}`
      );
      assert.equal(response.status, 200, `catalog limit ${limit}`);
      const payload = await responseJson(response);
      assert.ok((payload.products as unknown[]).length <= limit);
      assert.equal(
        (payload.pagination as { limit: number }).limit,
        limit
      );
    }

    for (const query of [
      "limit=101",
      "limit=-1",
      "limit=0",
      "page=0",
      "page=-1",
      "page=invalid",
      "page=100002&limit=1",
    ]) {
      const response = await fetch(
        `${baseUrl}/api/products?${query}`
      );
      assert.equal(response.status, 400, query);
    }

    const publicFields = [
      ["search", INPUT_LIMITS.catalog.search],
      ["category", INPUT_LIMITS.catalog.category],
      ["brand", INPUT_LIMITS.catalog.brand],
      ["featured", INPUT_LIMITS.catalog.featured],
      ["inStock", INPUT_LIMITS.catalog.inStock],
    ] as const;

    for (const [parameter, maximum] of publicFields) {
      for (const length of [maximum - 1, maximum]) {
        const response: Response = await fetch(
          `${baseUrl}/api/products?${parameter}=${"x".repeat(length)}`
        );
        assert.equal(response.status, 200, `${parameter} at ${length}`);
      }
      const oversizedResponse: Response = await fetch(
        `${baseUrl}/api/products?${parameter}=${"x".repeat(maximum + 1)}`
      );
      assert.equal(oversizedResponse.status, 400, parameter);
    }

    for (const length of [
      INPUT_LIMITS.product.search - 1,
      INPUT_LIMITS.product.search,
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/products?q=${"x".repeat(length)}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 200, `admin q at ${length}`);
    }
    const oversizedAdminSearch = await fetch(
      `${baseUrl}/api/admin/products?q=${"x".repeat(
        INPUT_LIMITS.product.search + 1
      )}`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(oversizedAdminSearch.status, 400);

    for (const limit of [1, 100]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/products?page=1&limit=${limit}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 200, `admin product limit ${limit}`);
      const payload = await responseJson(response);
      assert.ok((payload.products as unknown[]).length <= limit);
      assert.equal(
        (payload.pagination as { limit: number }).limit,
        limit
      );
    }

    for (const query of [
      "limit=101",
      "limit=-1",
      "limit=0",
      "page=0",
      "page=-1",
      "page=invalid",
      "page=100002&limit=1",
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/products?${query}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 400, query);
    }

    const adminCustomersResponse = await fetch(
      `${baseUrl}/api/admin/customers`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(adminCustomersResponse.status, 200);
    const adminCustomersPayload = await responseJson(adminCustomersResponse);
    assert.equal(
      (adminCustomersPayload.pagination as { pageSize: number }).pageSize,
      50
    );
    assert.ok(
      (adminCustomersPayload.customers as unknown[]).length <= 50
    );
    for (const length of [
      INPUT_LIMITS.customer.search - 1,
      INPUT_LIMITS.customer.search,
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/customers?q=${"x".repeat(length)}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 200, `admin customer q at ${length}`);
    }
    const oversizedCustomerSearch = await fetch(
      `${baseUrl}/api/admin/customers?q=${"x".repeat(
        INPUT_LIMITS.customer.search + 1
      )}`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(oversizedCustomerSearch.status, 400);
    const oversizedCustomersPage = await fetch(
      `${baseUrl}/api/admin/customers?page=2002`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(oversizedCustomersPage.status, 400);

    const adminCustomerOrdersResponse = await fetch(
      `${baseUrl}/api/admin/customers/${fixture.customerA.id}`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(adminCustomerOrdersResponse.status, 200);
    const adminCustomerOrdersPayload =
      await responseJson(adminCustomerOrdersResponse);
    assert.equal(
      (adminCustomerOrdersPayload.pagination as { pageSize: number }).pageSize,
      20
    );
    assert.ok(
      (adminCustomerOrdersPayload.orders as unknown[]).length <= 20
    );
    const oversizedCustomerOrdersPage = await fetch(
      `${baseUrl}/api/admin/customers/${fixture.customerA.id}?page=5002`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(oversizedCustomerOrdersPage.status, 400);

    for (const length of [
      INPUT_LIMITS.order.adminSearch - 1,
      INPUT_LIMITS.order.adminSearch,
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/orders?search=${"x".repeat(length)}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 200, `admin order search at ${length}`);
    }
    const oversizedOrderSearch = await fetch(
      `${baseUrl}/api/admin/orders?search=${"x".repeat(
        INPUT_LIMITS.order.adminSearch + 1
      )}`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(oversizedOrderSearch.status, 400);
  });

  test("product path identifiers accept the maximum length and reject longer values", async () => {
    assert.ok(fixture);
    for (const length of [
      INPUT_LIMITS.product.slug - 1,
      INPUT_LIMITS.product.slug,
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/products/${"x".repeat(length)}`
      );
      assert.equal(response.status, 404, `slug at ${length}`);
    }
    const oversizedSlug = await fetch(
      `${baseUrl}/api/products/${"x".repeat(INPUT_LIMITS.product.slug + 1)}`
    );
    assert.equal(oversizedSlug.status, 400);

    for (const length of [
      INPUT_LIMITS.product.id - 1,
      INPUT_LIMITS.product.id,
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/products/${"x".repeat(length)}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 404, `product ID at ${length}`);
    }
    const oversizedId = await fetch(
      `${baseUrl}/api/admin/products/${"x".repeat(
        INPUT_LIMITS.product.id + 1
      )}`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(oversizedId.status, 400);

    for (const length of [
      INPUT_LIMITS.order.id - 1,
      INPUT_LIMITS.order.id,
    ]) {
      const customerOrderAtLimit: Response = await fetch(
        `${baseUrl}/api/customer/orders/${"x".repeat(length)}`,
        { headers: customerHeaders(fixture.customerAToken) }
      );
      assert.equal(customerOrderAtLimit.status, 404);

      const adminOrderAtLimit: Response = await fetch(
        `${baseUrl}/api/admin/orders/${"x".repeat(length)}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(adminOrderAtLimit.status, 404);
    }

    const oversizedOrderId = "x".repeat(INPUT_LIMITS.order.id + 1);
    const customerOrderOverLimit = await fetch(
      `${baseUrl}/api/customer/orders/${oversizedOrderId}`,
      { headers: customerHeaders(fixture.customerAToken) }
    );
    assert.equal(customerOrderOverLimit.status, 400);

    const adminOrderOverLimit = await fetch(
      `${baseUrl}/api/admin/orders/${oversizedOrderId}`,
      { headers: adminHeaders(fixture.adminToken) }
    );
    assert.equal(adminOrderOverLimit.status, 400);
  });

  test("all supported category URLs resolve, including valid categories with no products", async () => {
    assert.ok(fixture);
    for (const category of getSupportedCategories()) {
      const response = await fetch(`${baseUrl}${getCategoryHref(category)}`);
      const html = await response.text();
      assert.equal(
        response.status,
        200,
        `${category.slug} should be a valid route: ${html.slice(0, 2_000)}`
      );
      assert.ok(html.includes(category.displayName));
    }

    const emptyCategory = getSupportedCategories().find(
      (category) => category.productCategory !== "PC Components"
    );
    assert.ok(emptyCategory);
    const emptyResponse = await fetch(
      `${baseUrl}${getCategoryHref(emptyCategory)}`
    );
    const emptyHtml = await emptyResponse.text();
    assert.equal(emptyResponse.status, 200, emptyHtml.slice(0, 2_000));
    assert.match(emptyHtml, /No products in this category yet/);

    const populatedResponse = await fetch(
      `${baseUrl}${getCategoryHref(
        getSupportedCategories().find(
          (category) => category.productCategory === "PC Components"
        )!
      )}`
    );
    const populatedHtml = await populatedResponse.text();
    assert.equal(populatedResponse.status, 200, populatedHtml.slice(0, 2_000));
    assert.match(populatedHtml, new RegExp(`TEST ONLY Order API Product ${runId}`));
  });

  test("unsupported category URLs return deliberate 404 responses", async () => {
    for (const slug of [
      "accessories",
      "peripherals",
      "monitors",
      "networking",
    ]) {
      const response = await fetch(`${baseUrl}/categories/${slug}`);
      assert.equal(response.status, 404, `${slug} must not resolve accidentally`);
    }
  });

  test("homepage and header expose only supported category navigation links", async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();
    assert.equal(response.status, 200, html.slice(0, 2_000));
    const headerHtml = html.match(/<header[\s\S]*?<\/header>/)?.[0];
    assert.ok(headerHtml, "The homepage response should render the shared header");

    const categoryLinks = (markup: string) =>
      Array.from(markup.matchAll(/href="(\/categories\/[^"]+)"/g), (match) =>
        match[1]
      );
    const supportedHrefs = new Set(
      getSupportedCategories().map(getCategoryHref)
    );
    const homepageCategoryHrefs = getSupportedCategories()
      .filter((category) => category.homepage)
      .map(getCategoryHref);
    const headerLinks = categoryLinks(headerHtml);
    const homepageLinks = categoryLinks(html.replace(headerHtml, ""));

    assert.deepEqual(
      new Set(headerLinks),
      new Set(getHeaderCategories().map(getCategoryHref))
    );
    assert.deepEqual(
      new Set(homepageLinks),
      new Set(homepageCategoryHrefs)
    );
    for (const href of [...headerLinks, ...homepageLinks]) {
      assert.ok(supportedHrefs.has(href), `Unexpected category link: ${href}`);
    }
    for (const slug of [
      "accessories",
      "peripherals",
      "monitors",
      "networking",
    ]) {
      assert.ok(!headerLinks.includes(`/categories/${slug}`));
      assert.ok(!homepageLinks.includes(`/categories/${slug}`));
    }
    assert.ok(
      CATEGORY_CONFIG.filter((category) => category.productCategory === null)
        .every((category) => category.homepage === undefined),
      "Unsupported categories must not appear as linked homepage categories."
    );
  });

  test("shop and product detail pages remain available", async () => {
    const shopResponse = await fetch(`${baseUrl}/shop`);
    const shopHtml = await shopResponse.text();
    assert.equal(shopResponse.status, 200, shopHtml.slice(0, 2_000));
    assert.ok(createdProduct);
    const productResponse = await fetch(
      `${baseUrl}/products/${createdProduct.slug}`
    );
    const productHtml = await productResponse.text();
    assert.equal(productResponse.status, 200, productHtml.slice(0, 2_000));
    assert.match(productHtml, new RegExp(`TEST ONLY Order API Product ${runId}`));
  });

  test("security headers are present on representative pages and API responses", async () => {
    assert.ok(fixture);
    assert.ok(createdProduct);
    const category = getSupportedCategories()[0];
    assert.ok(category);

    const responses = [
      ["homepage", `${baseUrl}/`],
      ["product", `${baseUrl}/products/${createdProduct.slug}`],
      ["category", `${baseUrl}/categories/${category.slug}`],
      ["login", `${baseUrl}/login`],
      ["checkout", `${baseUrl}/checkout`],
      ["API", `${baseUrl}/api/products?limit=1`],
      [
        "admin page",
        `${baseUrl}/admin`,
        { headers: adminHeaders(fixture.adminToken) },
      ],
    ] as const;

    for (const [label, url, options] of responses) {
      const response = await fetch(url, options);
      assert.equal(response.status, 200, `${label} status`);
      assert.ok(
        response.headers.get("content-security-policy"),
        `${label} CSP`
      );
      assert.equal(
        response.headers.get("x-content-type-options"),
        "nosniff",
        `${label} nosniff`
      );
      assert.equal(
        response.headers.get("x-frame-options"),
        "DENY",
        `${label} frame protection`
      );
      assert.equal(
        response.headers.get("referrer-policy"),
        "strict-origin-when-cross-origin",
        `${label} referrer policy`
      );
      assert.ok(
        response.headers.get("permissions-policy"),
        `${label} permissions policy`
      );
      assert.equal(
        response.headers.get("strict-transport-security"),
        null,
        `${label} must not enable HSTS on the local HTTP test server`
      );
    }
  });

  test("Customer A checks out the TEST product and reserves two units", async () => {
    assert.ok(fixture);
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        ...customerHeaders(fixture.customerAToken),
        "content-type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        customer: {
          firstName: "TEST ONLY Customer",
          lastName: "A",
          phone: "TEST-ONLY-A",
          email: fixture.customerA.email,
          address: "",
          city: "",
          district: "",
          postalCode: "",
        },
        items: [{ productId: fixture.productId, quantity: 2 }],
        deliveryMethod: "pickup",
        paymentMethod: "cod",
      }),
    });

    const payload = await responseJson(response);
    assert.equal(response.status, 201, JSON.stringify(payload));
    const order = payload.order as { id: string; status: string } | undefined;
    const payment = payload.payment as { status: string } | undefined;
    if (typeof order?.id === "string") {
      fixture.orderId = order.id;
      createdOrderId = order.id;
    }
    assert.ok(order?.id);
    assert.equal(order.status, "PENDING");
    assert.equal(payment?.status, "pending");

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.productId },
      select: { stockQuantity: true },
    });
    assert.equal(product.stockQuantity, 8);
  });

  test("sequential duplicate checkouts return the original order and reserve stock once", async () => {
    assert.ok(fixture);
    const key = randomUUID();
    const body = checkoutBody(
      fixture.customerA.email,
      fixture.idempotencyProductId,
      2
    );
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });

    const firstResponse = await submitCheckout(
      fixture.customerAToken,
      key,
      body
    );
    const firstPayload = await responseJson(firstResponse);
    const retryResponse = await submitCheckout(
      fixture.customerAToken,
      key,
      body
    );
    const retryPayload = await responseJson(retryResponse);

    assert.equal(firstResponse.status, 201);
    assert.equal(retryResponse.status, 201);
    assert.deepEqual(retryPayload, firstPayload);
    const firstOrder = firstPayload.order as { id: string };
    const retryOrder = retryPayload.order as { id: string };
    assert.equal(retryOrder.id, firstOrder.id);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });
    assert.equal(product.stockQuantity, before.stockQuantity - 2);
  });

  test("reusing a checkout key with a different payload returns 409", async () => {
    assert.ok(fixture);
    const key = randomUUID();
    const firstResponse = await submitCheckout(
      fixture.customerAToken,
      key,
      checkoutBody(fixture.customerA.email, fixture.idempotencyProductId, 1)
    );
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });
    const differentResponse = await submitCheckout(
      fixture.customerAToken,
      key,
      checkoutBody(fixture.customerA.email, fixture.idempotencyProductId, 2)
    );

    assert.equal(firstResponse.status, 201);
    assert.equal(differentResponse.status, 409);
    const after = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });
    assert.equal(after.stockQuantity, before.stockQuantity);
  });

  test("concurrent duplicate checkouts create one order and reserve stock once", async () => {
    assert.ok(fixture);
    const key = randomUUID();
    const body = checkoutBody(
      fixture.customerA.email,
      fixture.idempotencyProductId,
      3
    );
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });

    const responses = await Promise.all([
      submitCheckout(fixture.customerAToken, key, body),
      submitCheckout(fixture.customerAToken, key, body),
    ]);
    const payloads = await Promise.all(responses.map(responseJson));

    assert.deepEqual(
      responses.map((response) => response.status),
      [201, 201]
    );
    assert.deepEqual(payloads[0], payloads[1]);
    const firstOrder = payloads[0].order as { id: string };
    const secondOrder = payloads[1].order as { id: string };
    assert.equal(firstOrder.id, secondOrder.id);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });
    assert.equal(product.stockQuantity, before.stockQuantity - 3);
  });

  test("different checkout keys create independent orders", async () => {
    assert.ok(fixture);
    const body = checkoutBody(
      fixture.customerA.email,
      fixture.idempotencyProductId,
      1
    );
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });
    const responses = await Promise.all([
      submitCheckout(fixture.customerAToken, randomUUID(), body),
      submitCheckout(fixture.customerAToken, randomUUID(), body),
    ]);
    const payloads = await Promise.all(responses.map(responseJson));

    assert.deepEqual(
      responses.map((response) => response.status),
      [201, 201]
    );
    const firstOrder = payloads[0].order as { id: string };
    const secondOrder = payloads[1].order as { id: string };
    assert.notEqual(firstOrder.id, secondOrder.id);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.idempotencyProductId },
      select: { stockQuantity: true },
    });
    assert.equal(product.stockQuantity, before.stockQuantity - 2);
  });

  test("idempotency keys are scoped to the authenticated customer", async () => {
    assert.ok(fixture);
    const key = randomUUID();
    const customerAResponse = await submitCheckout(
      fixture.customerAToken,
      key,
      checkoutBody(
        fixture.customerA.email,
        fixture.idempotencyProductId,
        1
      )
    );
    const customerBResponse = await submitCheckout(
      fixture.customerBToken,
      key,
      checkoutBody(
        fixture.customerB.email,
        fixture.idempotencyProductId,
        1
      )
    );

    assert.equal(customerAResponse.status, 201);
    assert.equal(customerBResponse.status, 201);
    const customerAOrder = (await responseJson(customerAResponse)).order as {
      id: string;
    };
    const customerBOrder = (await responseJson(customerBResponse)).order as {
      id: string;
    };
    assert.notEqual(customerAOrder.id, customerBOrder.id);

    const [storedA, storedB] = await Promise.all([
      prisma.order.findUniqueOrThrow({
        where: { id: customerAOrder.id },
        select: { customerId: true },
      }),
      prisma.order.findUniqueOrThrow({
        where: { id: customerBOrder.id },
        select: { customerId: true },
      }),
    ]);
    assert.equal(storedA.customerId, fixture.customerA.id);
    assert.equal(storedB.customerId, fixture.customerB.id);
  });

  test("Customer A can retrieve their own orders", async () => {
    const currentFixture = fixture;
    assert.ok(currentFixture);
    assert.ok(currentFixture.orderId);
    const response = await fetch(`${baseUrl}/api/customer/orders`, {
      headers: customerHeaders(currentFixture.customerAToken),
    });
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    const orders = payload.orders as { id: string }[];
    assert.ok(orders.some((order) => order.id === currentFixture.orderId));
  });

  test("Customer A can retrieve their order detail", async () => {
    const currentFixture = fixture;
    assert.ok(currentFixture);
    assert.ok(currentFixture.orderId);
    const response = await fetch(
      `${baseUrl}/api/customer/orders/${currentFixture.orderId}`,
      { headers: customerHeaders(currentFixture.customerAToken) }
    );
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    const order = payload.order as { id: string; status: string } | undefined;
    assert.equal(order?.id, currentFixture.orderId);
    assert.equal(order?.status, "PENDING");
  });

  test("payment verification requires an authenticated customer", async () => {
    const currentFixture = fixture;
    assert.ok(currentFixture?.orderId);
    const response = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: currentFixture.orderId }),
    });
    assert.equal(response.status, 401);

    const adminResponse = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: {
        ...adminHeaders(currentFixture.adminToken),
        "content-type": "application/json",
      },
      body: JSON.stringify({ orderId: currentFixture.orderId }),
    });
    assert.equal(adminResponse.status, 401);
  });

  test("customers can verify only their own order payment", async () => {
    const currentFixture = fixture;
    assert.ok(currentFixture?.orderId);

    const otherCustomerResponse = await fetch(
      `${baseUrl}/api/payments/verify`,
      {
        method: "POST",
        headers: {
          ...customerHeaders(currentFixture.customerBToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ orderId: currentFixture.orderId }),
      }
    );
    assert.equal(otherCustomerResponse.status, 404);

    const ownerResponse = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: {
        ...customerHeaders(currentFixture.customerAToken),
        "content-type": "application/json",
      },
      body: JSON.stringify({ orderId: currentFixture.orderId }),
    });
    assert.equal(ownerResponse.status, 200);
    const payload = await responseJson(ownerResponse);
    assert.equal(payload.orderId, currentFixture.orderId);
    assert.equal(payload.status, "PENDING");
  });

  test("Customer B cannot retrieve Customer A's order", async () => {
    const currentFixture = fixture;
    assert.ok(currentFixture);
    assert.ok(currentFixture.orderId);
    const response = await fetch(
      `${baseUrl}/api/customer/orders/${currentFixture.orderId}`,
      { headers: customerHeaders(currentFixture.customerBToken) }
    );
    assert.equal(response.status, 404);
  });

  test("customer order pagination rejects invalid values with 400", async () => {
    assert.ok(fixture);
    const defaultResponse = await fetch(`${baseUrl}/api/customer/orders`, {
      headers: customerHeaders(fixture.customerAToken),
    });
    assert.equal(defaultResponse.status, 200);
    const defaultPayload = await responseJson(defaultResponse);
    assert.equal(defaultPayload.pageSize, 10);
    assert.ok((defaultPayload.orders as unknown[]).length <= 10);

    for (const pageSize of [1, 50]) {
      const response: Response = await fetch(
        `${baseUrl}/api/customer/orders?page=1&pageSize=${pageSize}`,
        { headers: customerHeaders(fixture.customerAToken) }
      );
      assert.equal(response.status, 200, `customer pageSize ${pageSize}`);
      const payload = await responseJson(response);
      assert.ok((payload.orders as unknown[]).length <= pageSize);
      assert.equal(payload.pageSize, pageSize);
    }

    for (const query of [
      "page=0&pageSize=10",
      "page=-1",
      "page=invalid",
      "page=10002&pageSize=10",
      "pageSize=51",
      "pageSize=-1",
      "pageSize=0",
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/customer/orders?${query}`,
        { headers: customerHeaders(fixture.customerAToken) }
      );
      assert.equal(response.status, 400, query);
    }
  });

  test("a customer session receives 403 from the admin order API", async () => {
    assert.ok(fixture);
    const customerResponse = await fetch(`${baseUrl}/api/customer/orders`, {
      headers: customerHeaders(fixture.customerAToken),
    });
    assert.equal(customerResponse.status, 200);

    const response = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: customerHeaders(fixture.customerAToken),
    });
    const payload = await responseJson(response);
    assert.equal(response.status, 403, JSON.stringify(payload));
  });

  test("an authenticated admin can retrieve orders", async () => {
    const currentFixture = fixture;
    assert.ok(currentFixture);
    assert.ok(currentFixture.orderId);
    const response = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: adminHeaders(currentFixture.adminToken),
    });
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    const orders = payload.orders as { id: string }[];
    assert.ok(orders.some((order) => order.id === currentFixture.orderId));
  });

  test("admin order pagination rejects invalid page sizes with 400", async () => {
    assert.ok(fixture);
    const defaultResponse = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: adminHeaders(fixture.adminToken),
    });
    assert.equal(defaultResponse.status, 200);
    const defaultPayload = await responseJson(defaultResponse);
    assert.equal(defaultPayload.pageSize, 20);
    assert.ok((defaultPayload.orders as unknown[]).length <= 20);

    for (const pageSize of [20, 50, 100]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/orders?page=1&pageSize=${pageSize}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 200, `admin pageSize ${pageSize}`);
      const payload = await responseJson(response);
      assert.ok((payload.orders as unknown[]).length <= pageSize);
      assert.equal(payload.pageSize, pageSize);
    }

    for (const query of [
      "page=1&pageSize=21",
      "pageSize=101",
      "pageSize=-1",
      "pageSize=0",
      "page=0",
      "page=-1",
      "page=invalid",
      "page=100002&pageSize=20",
    ]) {
      const response: Response = await fetch(
        `${baseUrl}/api/admin/orders?${query}`,
        { headers: adminHeaders(fixture.adminToken) }
      );
      assert.equal(response.status, 400, query);
    }
  });

  test("admin can transition the order from PENDING to CONFIRMED", async () => {
    assert.ok(fixture?.orderId);
    const response = await fetch(
      `${baseUrl}/api/admin/orders/${fixture.orderId}`,
      {
        method: "PATCH",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }
    );
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    assert.equal(payload.success, true);
  });

  test("Order.status is CONFIRMED in the TEST database", async () => {
    assert.ok(fixture?.orderId);
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: fixture.orderId },
      select: { status: true },
    });
    assert.equal(order.status, "CONFIRMED");
  });

  test("status history records the order transition and test admin", async () => {
    assert.ok(fixture?.orderId);
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: fixture.orderId },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(history.length, 1);
    assert.equal(history[0].orderId, fixture.orderId);
    assert.equal(history[0].fromStatus, "PENDING");
    assert.equal(history[0].toStatus, "CONFIRMED");
    assert.equal(history[0].changedBy, adminEmail);
  });

  test("Customer A sees the current database status and status history", async () => {
    assert.ok(fixture?.orderId);
    const response = await fetch(
      `${baseUrl}/api/customer/orders/${fixture.orderId}`,
      { headers: customerHeaders(fixture.customerAToken) }
    );
    assert.equal(response.status, 200);
    const payload = await responseJson(response);
    const order = payload.order as {
      status: string;
      statusHistory: { fromStatus: string; toStatus: string }[];
    };
    assert.equal(order.status, "CONFIRMED");
    assert.ok(
      order.statusHistory.some(
        (entry) =>
          entry.fromStatus === "PENDING" && entry.toStatus === "CONFIRMED"
      )
    );
  });

  test("admin can transition the order from CONFIRMED to PROCESSING", async () => {
    assert.ok(fixture?.orderId);
    const response = await fetch(
      `${baseUrl}/api/admin/orders/${fixture.orderId}`,
      {
        method: "PATCH",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "PROCESSING" }),
      }
    );
    assert.equal(response.status, 200);
  });

  test("admin cancels the PROCESSING order through the real API", async () => {
    assert.ok(fixture?.orderId);
    const response = await fetch(
      `${baseUrl}/api/admin/orders/${fixture.orderId}`,
      {
        method: "PATCH",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      }
    );
    assert.equal(response.status, 200);
  });

  test("cancellation sets Order.status to CANCELLED in the TEST database", async () => {
    assert.ok(fixture?.orderId);
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: fixture.orderId },
      select: { status: true },
    });
    assert.equal(order.status, "CANCELLED");
  });

  test("cancellation restores the two reserved units exactly once", async () => {
    assert.ok(fixture);
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.productId },
      select: { stockQuantity: true },
    });
    assert.equal(product.stockQuantity, 10);
  });

  test("cancellation history records PROCESSING to CANCELLED", async () => {
    assert.ok(fixture?.orderId);
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: fixture.orderId },
      orderBy: { createdAt: "asc" },
    });
    const cancellation = history.find((entry) => entry.toStatus === "CANCELLED");
    assert.ok(cancellation);
    assert.equal(cancellation.orderId, fixture.orderId);
    assert.equal(cancellation.fromStatus, "PROCESSING");
    assert.equal(cancellation.changedBy, adminEmail);
  });

  test("a repeated cancellation request is rejected", async () => {
    assert.ok(fixture?.orderId);
    const response = await fetch(
      `${baseUrl}/api/admin/orders/${fixture.orderId}`,
      {
        method: "PATCH",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      }
    );
    assert.equal(response.status, 409);
  });

  test("repeated cancellation does not restore stock or add history again", async () => {
    assert.ok(fixture);
    const [product, history] = await Promise.all([
      prisma.product.findUniqueOrThrow({
        where: { id: fixture.productId },
        select: { stockQuantity: true },
      }),
      prisma.orderStatusHistory.count({
        where: { orderId: fixture.orderId },
      }),
    ]);
    assert.equal(product.stockQuantity, 10);
    assert.equal(history, 3);
  });

  test("Customer A checkout consumes the stock-restore product's final unit", async () => {
    assert.ok(fixture);
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        ...customerHeaders(fixture.customerAToken),
        "content-type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        customer: {
          firstName: "TEST ONLY Customer",
          lastName: "A",
          phone: "TEST-ONLY-A",
          email: fixture.customerA.email,
          address: "",
          city: "",
          district: "",
          postalCode: "",
        },
        items: [{ productId: fixture.stockRestoreProductId, quantity: 1 }],
        deliveryMethod: "pickup",
        paymentMethod: "cod",
      }),
    });

    const payload = await responseJson(response);
    assert.equal(response.status, 201, JSON.stringify(payload));
    const order = payload.order as { id: string; status: string } | undefined;
    if (typeof order?.id === "string") {
      fixture.stockRestoreOrderId = order.id;
      createdStockRestoreOrderId = order.id;
    }
    assert.ok(order?.id);
    assert.equal(order.status, "PENDING");

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.stockRestoreProductId },
      select: { stockQuantity: true, inStock: true },
    });
    assert.equal(product.stockQuantity, 0);
    assert.equal(product.inStock, false);
  });

  test("admin cancellation restores the final unit and product availability", async () => {
    assert.ok(fixture?.stockRestoreOrderId);
    const response = await fetch(
      `${baseUrl}/api/admin/orders/${fixture.stockRestoreOrderId}`,
      {
        method: "PATCH",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      }
    );
    assert.equal(response.status, 200);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.stockRestoreProductId },
      select: { stockQuantity: true, inStock: true },
    });
    assert.equal(product.stockQuantity, 1);
    assert.equal(product.inStock, true);
  });

  test("repeated stock-restore cancellation is rejected", async () => {
    assert.ok(fixture?.stockRestoreOrderId);
    const response = await fetch(
      `${baseUrl}/api/admin/orders/${fixture.stockRestoreOrderId}`,
      {
        method: "PATCH",
        headers: {
          ...adminHeaders(fixture.adminToken),
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      }
    );
    assert.equal(response.status, 409);
  });

  test("repeated stock-restore cancellation changes neither inventory nor history", async () => {
    assert.ok(fixture?.stockRestoreOrderId);
    const [product, history] = await Promise.all([
      prisma.product.findUniqueOrThrow({
        where: { id: fixture.stockRestoreProductId },
        select: { stockQuantity: true, inStock: true },
      }),
      prisma.orderStatusHistory.findMany({
        where: { orderId: fixture.stockRestoreOrderId },
      }),
    ]);
    assert.equal(product.stockQuantity, 1);
    assert.equal(product.inStock, true);
    assert.equal(history.length, 1);
    assert.equal(history[0].fromStatus, "PENDING");
    assert.equal(history[0].toStatus, "CANCELLED");
  });
});
