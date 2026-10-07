import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "dotenv";
import { defineConfig } from "prisma/config";

const testEnvPath = resolve(process.cwd(), ".env.test.local");
let testEnv: Record<string, string>;

try {
  testEnv = parse(readFileSync(testEnvPath));
} catch {
  throw new Error(
    "Integration test database configuration is missing. Create .env.test.local with DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST."
  );
}

function requireTestUrl(name: "DATABASE_URL_TEST" | "DIRECT_DATABASE_URL_TEST") {
  const value = testEnv[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is required in .env.test.local. No database command was run.`
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${name} in .env.test.local must be a valid PostgreSQL URL. No database command was run.`
    );
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(
      `${name} in .env.test.local must use the PostgreSQL protocol. No database command was run.`
    );
  }

  return { value, url };
}

function targetKey(url: URL): string {
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

const testDatabase = requireTestUrl("DATABASE_URL_TEST");
const directTestDatabase = requireTestUrl("DIRECT_DATABASE_URL_TEST");

if (targetKey(testDatabase.url) !== targetKey(directTestDatabase.url)) {
  throw new Error(
    "DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST must target the same test database. No database command was run."
  );
}

const productionSources = [
  {
    source: "process environment",
    value: process.env.DATABASE_URL,
  },
  {
    source: "process environment",
    value: process.env.DIRECT_DATABASE_URL,
  },
];

for (const productionFile of [".env.local", ".env"]) {
  try {
    const productionEnv = parse(
      readFileSync(resolve(process.cwd(), productionFile))
    );
    productionSources.push(
      {
        source: productionFile,
        value: productionEnv.DATABASE_URL,
      },
      {
        source: productionFile,
        value: productionEnv.DIRECT_DATABASE_URL,
      },
      {
        source: productionFile,
        value: productionEnv.DIRECT_URL,
      }
    );
  } catch {
    // Optional production environment files are checked when present.
  }
}

for (const { source, value: productionValue } of productionSources) {
  if (!productionValue) continue;

  try {
    const productionUrl = new URL(productionValue);
    const matchesTestTarget =
      targetKey(testDatabase.url) === targetKey(productionUrl) ||
      targetKey(directTestDatabase.url) === targetKey(productionUrl);

    if (source === ".env.local" && matchesTestTarget) {
      continue;
    }

    if (matchesTestTarget) {
      throw new Error(
        "TEST DATABASE URL MATCHES PRODUCTION DATABASE. TEST DATABASE COMMAND ABORTED."
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "TEST DATABASE URL MATCHES PRODUCTION DATABASE. TEST DATABASE COMMAND ABORTED."
    ) {
      throw error;
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directTestDatabase.value,
  },
});
