import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export type BuildArtifactTarget = "test" | "production";

const markerFileName = ".primezora-build-target";

export function writeBuildArtifactTarget(
  distDir: string,
  target: BuildArtifactTarget
): void {
  writeFileSync(
    resolve(distDir, markerFileName),
    `${target}\n`,
    { encoding: "utf8", flag: "w" }
  );
}

export function assertBuildArtifactTarget(
  distDir: string,
  expectedTarget: BuildArtifactTarget
): void {
  let marker: string;
  try {
    marker = readFileSync(resolve(distDir, markerFileName), "utf8");
  } catch {
    throw new Error(
      `Build artifact target marker is missing from ${distDir}. Rebuild with the matching target.`
    );
  }

  if (marker !== `${expectedTarget}\n`) {
    throw new Error(
      `Build artifact target does not match the requested ${expectedTarget} start. Rebuild with the matching target.`
    );
  }
}
