import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { parse } from "dotenv";

import { createAdminPasswordHash } from "../src/lib/admin-password";

function promptEmail(): Promise<string> {
  const interface_ = createInterface({ input: stdin, output: stdout });
  return interface_
    .question("Local admin email: ")
    .finally(() => interface_.close());
}

function promptHiddenPassword(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Admin setup requires an interactive terminal.");
  }

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolvePromise, rejectPromise) => {
    let password = "";

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };

    const onData = (chunk: string | Buffer) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          cleanup();
          rejectPromise(new Error("Admin setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolvePromise(password);
          return;
        }
        if (character === "\u0008" || character === "\u007f") {
          password = password.slice(0, -1);
          stdout.write("\b \b");
          continue;
        }
        password += character;
        stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

function setEnvironmentValues(
  contents: string,
  values: Record<string, string>
): string {
  const newline = contents.includes("\r\n") ? "\r\n" : "\n";
  const lines = contents.split(/\r?\n/);

  for (const [key, value] of Object.entries(values)) {
    const matches = lines.flatMap((line, index) =>
      new RegExp(`^\\s*${key}\\s*=`).test(line) ? [index] : []
    );
    if (matches.length > 1) {
      throw new Error(`Duplicate ${key} entries found in .env.test.local.`);
    }

    const entry = `${key}=${JSON.stringify(value)}`;
    if (matches.length === 1) {
      lines[matches[0]] = entry;
    } else {
      const trailingBlank = lines.at(-1) === "";
      if (trailingBlank) lines.pop();
      lines.push(entry);
      if (trailingBlank) lines.push("");
    }
  }

  return lines.join(newline);
}

async function main() {
  const envPath = resolve(process.cwd(), ".env.test.local");
  let existingContents: string;
  try {
    existingContents = readFileSync(envPath, "utf8");
  } catch {
    throw new Error(
      "Create .env.test.local with DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST before setting up local admin access."
    );
  }

  const existing = parse(existingContents);
  if (!existing.DATABASE_URL_TEST || !existing.DIRECT_DATABASE_URL_TEST) {
    throw new Error(
      ".env.test.local must contain DATABASE_URL_TEST and DIRECT_DATABASE_URL_TEST before setting up local admin access."
    );
  }

  const email = (await promptEmail()).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid administrator email address.");
  }

  const password = await promptHiddenPassword(
    "New local admin password (12+ characters): "
  );
  const confirmation = await promptHiddenPassword(
    "Confirm local admin password: "
  );
  if (password !== confirmation) {
    throw new Error("The passwords do not match.");
  }

  const passwordHash = await createAdminPasswordHash(password);
  const sessionSecret = randomBytes(32).toString("hex");
  const updatedContents = setEnvironmentValues(existingContents, {
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD_HASH: passwordHash,
    ADMIN_SESSION_SECRET: sessionSecret,
  });

  writeFileSync(envPath, updatedContents, "utf8");
  console.log(
    "Local admin credentials configured in .env.test.local. Restart the development server to use them."
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Unable to configure local admin access."
  );
  process.exitCode = 1;
});
