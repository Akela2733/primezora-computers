import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  configureDatabaseTarget,
  configureSeedDatabaseTarget,
} from "../scripts/database-target";
import {
  assertBuildArtifactTarget,
  writeBuildArtifactTarget,
} from "../scripts/build-artifact-target";

const testDatabaseUrl =
  "postgresql://test.invalid:5432/test_db?schema=public";
const directTestDatabaseUrl =
  "postgresql://test.invalid:5432/test_db?schema=public";

describe("database target selection", () => {
  test("defaults local development and QA to the isolated TEST target", () => {
    const env: Record<string, string | undefined> = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://production.invalid:5432/app",
      DIRECT_DATABASE_URL: "postgresql://production.invalid:5432/app",
    };

    const target = configureDatabaseTarget(env, {
      DATABASE_URL_TEST: testDatabaseUrl,
      DIRECT_DATABASE_URL_TEST: directTestDatabaseUrl,
    });

    assert.equal(target, "test");
    assert.equal(env.PRIMEZORA_DATABASE_TARGET, "test");
    assert.equal(env.PRISMA_RUNTIME_ENV, "test");
    assert.equal(env.DATABASE_URL, testDatabaseUrl);
    assert.equal(env.DIRECT_DATABASE_URL, directTestDatabaseUrl);
    assert.equal(env.DIRECT_URL, directTestDatabaseUrl);
  });

  test("does not fall back to production URLs when TEST configuration is missing", () => {
    const productionUrl = "postgresql://production.invalid:5432/app";
    const env: Record<string, string | undefined> = {
      NODE_ENV: "development",
      DATABASE_URL: productionUrl,
      DIRECT_DATABASE_URL: productionUrl,
    };

    assert.throws(
      () => configureDatabaseTarget(env, {}),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("DATABASE_URL_TEST") &&
        !error.message.includes(productionUrl)
    );
    assert.equal(env.DATABASE_URL, productionUrl);
    assert.notEqual(env.PRIMEZORA_DATABASE_TARGET, "production");
  });

  test("rejects TEST URLs that resolve to a configured non-TEST database", () => {
    const productionUrl = "postgresql://same.invalid:5432/app?schema=public";
    const env: Record<string, string | undefined> = {
      NODE_ENV: "development",
    };

    assert.throws(
      () =>
      configureDatabaseTarget(
        env,
        {
          DATABASE_URL_TEST: productionUrl,
          DIRECT_DATABASE_URL_TEST: productionUrl,
        },
        [{ source: ".env", url: productionUrl }]
      ),
      /must not target a configured non-TEST database/
    );
  });

  test("allows production only when explicitly selected with production runtime URLs", () => {
    const productionUrl = "postgresql://production.invalid:5432/app";
    const env: Record<string, string | undefined> = {
      NODE_ENV: "production",
      PRIMEZORA_DATABASE_TARGET: "production",
      DATABASE_URL: productionUrl,
    };

    assert.equal(configureDatabaseTarget(env, {}), "production");
    assert.equal(env.DATABASE_URL, productionUrl);
    assert.equal(env.PRISMA_RUNTIME_ENV, "production");
  });

  test("rejects production target selection outside production runtime", () => {
    const env: Record<string, string | undefined> = {
      NODE_ENV: "development",
      PRIMEZORA_DATABASE_TARGET: "production",
      DATABASE_URL: "postgresql://production.invalid:5432/app",
    };

    assert.throws(
      () => configureDatabaseTarget(env, {}),
      /requires NODE_ENV=production/
    );
  });

  test("fails closed when a production runtime has no explicit target", () => {
    const env: Record<string, string | undefined> = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://production.invalid:5432/app",
    };

    assert.throws(
      () => configureDatabaseTarget(env, {}),
      /requires an explicit PRIMEZORA_DATABASE_TARGET/
    );
  });
});

describe("database seed target selection", () => {
  test("rejects a seed invocation without an explicit target", () => {
    assert.throws(
      () => configureSeedDatabaseTarget({}),
      /requires PRIMEZORA_DATABASE_TARGET=test or production/
    );
  });

  test("TEST seed requires and selects TEST configuration only", () => {
    const env: Record<string, string | undefined> = {
      PRIMEZORA_DATABASE_TARGET: "test",
      NODE_ENV: "development",
    };

    assert.equal(
      configureSeedDatabaseTarget(
        env,
        {
          DATABASE_URL_TEST: testDatabaseUrl,
          DIRECT_DATABASE_URL_TEST: directTestDatabaseUrl,
        },
        []
      ),
      "test"
    );
    assert.equal(env.DATABASE_URL, testDatabaseUrl);
    assert.equal(env.DIRECT_DATABASE_URL, directTestDatabaseUrl);
  });

  test("TEST seed fails when TEST configuration is missing", () => {
    const env: Record<string, string | undefined> = {
      PRIMEZORA_DATABASE_TARGET: "test",
    };

    assert.throws(
      () => configureSeedDatabaseTarget(env, {}, []),
      /DATABASE_URL_TEST is required/
    );
  });

  test("TEST seed rejects configured generic production URLs", () => {
    const env: Record<string, string | undefined> = {
      PRIMEZORA_DATABASE_TARGET: "test",
      DATABASE_URL: "postgresql://production.invalid:5432/app",
    };

    assert.throws(
      () =>
        configureSeedDatabaseTarget(
          env,
          {
            DATABASE_URL_TEST: testDatabaseUrl,
            DIRECT_DATABASE_URL_TEST: directTestDatabaseUrl,
          },
          [{ source: "process environment", url: env.DATABASE_URL! }]
        ),
      /TEST seed cannot run while production database URL variables are configured/
    );
  });

  test("production seed requires generic production configuration", () => {
    const env: Record<string, string | undefined> = {
      PRIMEZORA_DATABASE_TARGET: "production",
    };

    assert.throws(
      () => configureSeedDatabaseTarget(env, {}),
      /DIRECT_DATABASE_URL or DATABASE_URL is required/
    );
  });

  test("production seed rejects TEST URL variables", () => {
    const env: Record<string, string | undefined> = {
      PRIMEZORA_DATABASE_TARGET: "production",
      DATABASE_URL: "postgresql://production.invalid:5432/app",
      DATABASE_URL_TEST: testDatabaseUrl,
    };

    assert.throws(
      () => configureSeedDatabaseTarget(env, {}),
      /Production seed cannot run while TEST database URL variables are configured/
    );
  });

  test("seed target guard runs before Prisma initialization and preserves seed operations", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const seedSource = await readFile(
      resolve(process.cwd(), "prisma/seed.ts"),
      "utf8"
    );

    assert.ok(
      seedSource.indexOf("configureSeedDatabaseTarget();") <
        seedSource.indexOf("new PrismaClient")
    );
    assert.match(seedSource, /prisma\.product\.upsert\(/);
    assert.match(seedSource, /Products processed:/);
    assert.doesNotMatch(seedSource, /dotenv\/config/);
  });
});

describe("build artifact target marker", () => {
  test("TEST build writes a TEST marker", async () => {
    const { mkdtemp, readFile, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-test-build-"));

    try {
      writeBuildArtifactTarget(distDir, "test");
      assert.equal(
        await readFile(join(distDir, ".primezora-build-target"), "utf8"),
        "test\n"
      );
      assertBuildArtifactTarget(distDir, "test");
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("production build writes a production marker", async () => {
    const { mkdtemp, readFile, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-production-build-"));

    try {
      writeBuildArtifactTarget(distDir, "production");
      assert.equal(
        await readFile(join(distDir, ".primezora-build-target"), "utf8"),
        "production\n"
      );
      assertBuildArtifactTarget(distDir, "production");
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("TEST start rejects a production marker", async () => {
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-wrong-test-"));

    try {
      writeBuildArtifactTarget(distDir, "production");
      assert.throws(
        () => assertBuildArtifactTarget(distDir, "test"),
        /does not match the requested test start/
      );
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("production start rejects a TEST marker", async () => {
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-wrong-production-"));

    try {
      writeBuildArtifactTarget(distDir, "test");
      assert.throws(
        () => assertBuildArtifactTarget(distDir, "production"),
        /does not match the requested production start/
      );
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("start rejects a missing marker", async () => {
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-missing-marker-"));

    try {
      assert.throws(
        () => assertBuildArtifactTarget(distDir, "test"),
        /marker is missing/
      );
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("start rejects a malformed marker", async () => {
    const { mkdtemp, rm, writeFile } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-malformed-marker-"));

    try {
      await writeFile(join(distDir, ".primezora-build-target"), "test\nextra\n");
      assert.throws(
        () => assertBuildArtifactTarget(distDir, "test"),
        /does not match the requested test start/
      );
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("marker contains only the target and no secrets or database URLs", async () => {
    const { mkdtemp, readFile, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const distDir = await mkdtemp(join(tmpdir(), "primezora-marker-content-"));

    try {
      writeBuildArtifactTarget(distDir, "test");
      const marker = await readFile(
        join(distDir, ".primezora-build-target"),
        "utf8"
      );
      assert.equal(marker, "test\n");
      assert.doesNotMatch(marker, /postgres|https?:|secret|token|password/i);
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  test("start target guard runs before the Next.js process is spawned", async () => {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const wrapper = await readFile(
      resolve(process.cwd(), "scripts/run-next.ts"),
      "utf8"
    );

    assert.ok(
      wrapper.indexOf("assertBuildArtifactTarget(distDir, target)") <
        wrapper.indexOf("const result = spawnSync(")
    );
    const markerWrite = wrapper.lastIndexOf(
      "writeBuildArtifactTarget(distDir, target)"
    );
    assert.ok(
      markerWrite >
        wrapper.indexOf("for (const { executable, args } of commands)")
    );
  });
});
