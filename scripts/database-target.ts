import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "dotenv";

type DatabaseEnvironment = Record<string, string | undefined>;
type TestDatabaseEnvironment = {
  DATABASE_URL_TEST?: string;
  DIRECT_DATABASE_URL_TEST?: string;
};

function readTestDatabaseEnvironment(): TestDatabaseEnvironment {
  try {
    return parse(
      readFileSync(resolve(process.cwd(), ".env.test.local"))
    ) as TestDatabaseEnvironment;
  } catch {
    throw new Error(
      "Local development and QA require DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST in .env.test.local."
    );
  }
}

function requirePostgresUrl(value: string | undefined, name: string): URL {
  if (!value?.trim()) {
    throw new Error(`${name} is required for the selected database target.`);
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`);
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(`${name} must use the PostgreSQL protocol.`);
  }

  return url;
}

function databaseTargetKey(url: URL): string {
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  const schema = url.searchParams.get("schema") ?? "public";
  const host = url.hostname.toLowerCase();
  const supabaseProject =
    host.match(/^db\.([^.]+)\.supabase\.co$/)?.[1] ??
    (host.endsWith(".pooler.supabase.com")
      ? decodeURIComponent(url.username).split(".").at(-1)
      : undefined);

  return [
    supabaseProject?.toLowerCase() ?? host,
    database.toLowerCase(),
    schema.toLowerCase(),
  ].join("|");
}

function configuredNonTestDatabaseUrls(
  env: DatabaseEnvironment
): { source: string; url: string }[] {
  const urls = [
    {
      source: "process environment",
      url: env.DATABASE_URL,
    },
    {
      source: "process environment",
      url: env.DIRECT_DATABASE_URL,
    },
    {
      source: "process environment",
      url: env.DIRECT_URL,
    },
  ];

  for (const fileName of [
    ".env.local",
    ".env",
    ".env.development.local",
    ".env.development",
    ".env.production.local",
    ".env.production",
  ]) {
    try {
      const fileEnv = parse(
        readFileSync(resolve(process.cwd(), fileName))
      );
      urls.push(
        {
          source: fileName,
          url: fileEnv.DATABASE_URL,
        },
        {
          source: fileName,
          url: fileEnv.DIRECT_DATABASE_URL,
        },
        {
          source: fileName,
          url: fileEnv.DIRECT_URL,
        }
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        throw new Error(
          "Could not verify that TEST database configuration is isolated."
        );
      }
    }
  }

  return urls.filter(
    (entry): entry is { source: string; url: string } =>
      Boolean(entry.url?.trim())
  );
}

export function configureDatabaseTarget(
  env: DatabaseEnvironment = process.env,
  testDatabaseEnvironment?: TestDatabaseEnvironment,
  nonTestDatabaseUrls?: { source: string; url: string }[]
): "test" | "production" {
  const target = env.PRIMEZORA_DATABASE_TARGET;

  if (target === "production") {
    if (env.NODE_ENV !== "production") {
      throw new Error(
        "The production database target requires NODE_ENV=production."
      );
    }

    const runtimeUrl =
      env.DIRECT_DATABASE_URL ?? env.DATABASE_URL ?? env.DIRECT_URL;
    requirePostgresUrl(runtimeUrl, "DIRECT_DATABASE_URL or DATABASE_URL");

    env.DATABASE_URL ??= env.DIRECT_DATABASE_URL ?? env.DIRECT_URL;
    env.DIRECT_DATABASE_URL ??= env.DIRECT_URL ?? env.DATABASE_URL;
    env.PRISMA_RUNTIME_ENV = "production";
    return "production";
  }

  if (target !== undefined && target !== "" && target !== "test") {
    throw new Error(
      "PRIMEZORA_DATABASE_TARGET must be either test or production."
    );
  }

  if (target === undefined && env.NODE_ENV === "production") {
    throw new Error(
      "Production runtime requires an explicit PRIMEZORA_DATABASE_TARGET. Use the production build/start command or select test explicitly for QA."
    );
  }

  const testEnv =
    testDatabaseEnvironment ?? readTestDatabaseEnvironment();
  const testUrl = requirePostgresUrl(
    testEnv.DATABASE_URL_TEST,
    "DATABASE_URL_TEST"
  );
  const directTestUrl = requirePostgresUrl(
    testEnv.DIRECT_DATABASE_URL_TEST,
    "DIRECT_DATABASE_URL_TEST"
  );

  if (databaseTargetKey(testUrl) !== databaseTargetKey(directTestUrl)) {
    throw new Error(
      "DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST must target the same TEST database."
    );
  }

  for (const { source, url } of
    nonTestDatabaseUrls ?? configuredNonTestDatabaseUrls(env)) {
    try {
      const matchesTestDatabase =
        databaseTargetKey(new URL(url.trim())) === databaseTargetKey(testUrl);
      if (
        matchesTestDatabase &&
        source !== "process environment"
      ) {
        throw new Error(
          "TEST database configuration must not target a configured non-TEST database."
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "TEST database configuration must not target a configured non-TEST database."
      ) {
        throw error;
      }
    }
  }

  env.PRIMEZORA_DATABASE_TARGET = "test";
  env.PRISMA_RUNTIME_ENV = "test";
  env.DATABASE_URL_TEST = testEnv.DATABASE_URL_TEST!.trim();
  env.DIRECT_DATABASE_URL_TEST = testEnv.DIRECT_DATABASE_URL_TEST!.trim();
  env.DATABASE_URL = env.DATABASE_URL_TEST;
  env.DIRECT_DATABASE_URL = env.DIRECT_DATABASE_URL_TEST;
  env.DIRECT_URL = env.DIRECT_DATABASE_URL_TEST;
  return "test";
}

export function configureSeedDatabaseTarget(
  env: DatabaseEnvironment = process.env,
  testDatabaseEnvironment?: TestDatabaseEnvironment,
  nonTestDatabaseUrls?: { source: string; url: string }[]
): "test" | "production" {
  const target = env.PRIMEZORA_DATABASE_TARGET;
  if (target !== "test" && target !== "production") {
    throw new Error(
      "Database seed requires PRIMEZORA_DATABASE_TARGET=test or production."
    );
  }

  if (target === "test") {
    const productionUrls =
      nonTestDatabaseUrls ?? configuredNonTestDatabaseUrls(env);
    if (productionUrls.length > 0) {
      throw new Error(
        "TEST seed cannot run while production database URL variables are configured."
      );
    }
  } else {
    if (
      env.DATABASE_URL_TEST?.trim() ||
      env.DIRECT_DATABASE_URL_TEST?.trim()
    ) {
      throw new Error(
        "Production seed cannot run while TEST database URL variables are configured."
      );
    }
    env.NODE_ENV = "production";
  }

  return configureDatabaseTarget(
    env,
    testDatabaseEnvironment,
    target === "test" ? [] : undefined
  );
}
