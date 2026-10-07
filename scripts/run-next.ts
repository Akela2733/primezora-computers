import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import {
  assertBuildArtifactTarget,
  writeBuildArtifactTarget,
} from "./build-artifact-target";
import { configureDatabaseTarget } from "./database-target";

type NextCommand = "dev" | "build" | "start";

const command = process.argv[2] as NextCommand | undefined;
const productionRequested = process.argv[3] === "production";
const childEnv: Record<string, string | undefined> = { ...process.env };
const runtimeNodeEnv: "development" | "production" | "test" =
  command === "dev" ? "development" : "production";

if (command !== "dev" && command !== "build" && command !== "start") {
  throw new Error("Expected a Next.js command: dev, build, or start.");
}

if (process.argv[3] && !productionRequested) {
  throw new Error("The optional target argument must be production.");
}

if (command === "dev") {
  if (
    productionRequested ||
    childEnv.PRIMEZORA_DATABASE_TARGET === "production"
  ) {
    throw new Error("Local development cannot use the production database target.");
  }
  childEnv.PRIMEZORA_DATABASE_TARGET ??= "test";
} else if (productionRequested) {
  if (
    childEnv.PRIMEZORA_DATABASE_TARGET &&
    childEnv.PRIMEZORA_DATABASE_TARGET !== "production"
  ) {
    throw new Error(
      "The production command conflicts with PRIMEZORA_DATABASE_TARGET."
    );
  }
  childEnv.PRIMEZORA_DATABASE_TARGET = "production";
} else {
  if (
    childEnv.PRIMEZORA_DATABASE_TARGET !== undefined &&
    childEnv.PRIMEZORA_DATABASE_TARGET !== "" &&
    childEnv.PRIMEZORA_DATABASE_TARGET !== "test"
  ) {
    throw new Error(
      "PRIMEZORA_DATABASE_TARGET must be either test or production."
    );
  }
  if (
    childEnv.NODE_ENV === "production" &&
    childEnv.PRIMEZORA_DATABASE_TARGET !== "test"
  ) {
    throw new Error(
      "Production deployment must use the explicit production build/start command."
    );
  }
  childEnv.PRIMEZORA_DATABASE_TARGET = "test";
}

childEnv.NODE_ENV = runtimeNodeEnv;
const target = configureDatabaseTarget(childEnv);

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, childEnv.NEXT_DIST_DIR ?? ".next");
const nextCli = resolve(projectRoot, "node_modules/next/dist/bin/next");
const commands =
  command === "build"
    ? [
        {
          executable: resolve(
            projectRoot,
            "node_modules/prisma/build/index.js"
          ),
          args: ["generate"],
        },
        { executable: nextCli, args: ["build"] },
      ]
    : [{ executable: nextCli, args: [command] }];

if (command === "build") {
  rmSync(resolve(distDir, ".primezora-build-target"), { force: true });
}

if (command === "start") {
  assertBuildArtifactTarget(distDir, target);
}

for (const { executable, args } of commands) {
  const result = spawnSync(process.execPath, [executable, ...args], {
    cwd: projectRoot,
    env: {
      ...childEnv,
      NODE_ENV: runtimeNodeEnv,
    },
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (command === "build") {
  writeBuildArtifactTarget(distDir, target);
}
