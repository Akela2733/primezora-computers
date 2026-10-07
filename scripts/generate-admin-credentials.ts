import { randomBytes } from "node:crypto";
import { createAdminPasswordHash } from "../src/lib/admin-password";

async function main() {
  const email = process.argv[2] || "admin@primezora.com";
  const password = process.argv[3] || "Admin@Primezora2026!";

  const hash = await createAdminPasswordHash(password);
  const sessionSecret = randomBytes(32).toString("hex");

  console.log("\n=======================================================");
  console.log("   PRIMEZORA ADMIN CREDENTIALS GENERATED");
  console.log("=======================================================");
  console.log(`ADMIN_EMAIL=${email}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
  console.log("-------------------------------------------------------");
  console.log(`Plaintext password (for login): ${password}`);
  console.log("=======================================================\n");
}

main().catch(console.error);
