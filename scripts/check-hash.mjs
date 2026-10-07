// Inspect the existing hash from .env.local
import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";

const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const DERIVED_KEY_BYTES = 64;
const SALT_BYTES = 16;

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      DERIVED_KEY_BYTES,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELIZATION, maxmem: 64 * 1024 * 1024 },
      (err, key) => { if (err) reject(err); else resolve(key); }
    );
  });
}

// Existing hash from .env.local
const existingHash = "scrypt$32768$8$1$tpNcGJoVDXCFyum0nKlDeQ$NZyJWvclw87iBwOmv_03EEEE8s7fEbQhEOBIbuzmSjks6IOYM84QX45nuapUzlW8xaAxP1PNtQsHofqk0BXdSg";

const parts = existingHash.split("$");
console.log("Parts count:", parts.length);
console.log("Parts:", parts.map((p, i) => `[${i}] len=${p.length}: ${p}`).join("\n"));

// Check if it has exactly 6 parts (scheme + 5 values = correct)
if (parts.length !== 6) {
  console.error("\nERROR: Hash has wrong number of parts. Expected 6, got", parts.length);
} else {
  console.log("\nHash structure looks OK. Testing with password 'Admin@Primezora2026'...");
  const [scheme, cost, blockSize, par, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  console.log("Salt bytes:", salt.length, "(expected 16)");
  console.log("Hash bytes:", expected.length, "(expected 64)");

  try {
    const actual = await deriveKey("Admin@Primezora2026", salt);
    const match = timingSafeEqual(actual, expected);
    console.log("Password 'Admin@Primezora2026' matches:", match);
  } catch (e) {
    console.error("Error verifying:", e.message);
  }
}

// Generate a fresh hash for a known password
console.log("\n--- Generating fresh hash for 'Admin@Primezora2026' ---");
const newSalt = randomBytes(SALT_BYTES);
const newKey = await deriveKey("Admin@Primezora2026", newSalt);
const freshHash = [
  "scrypt",
  SCRYPT_COST,
  SCRYPT_BLOCK_SIZE,
  SCRYPT_PARALLELIZATION,
  newSalt.toString("base64url"),
  newKey.toString("base64url"),
].join("$");
console.log("Fresh ADMIN_PASSWORD_HASH:");
console.log(freshHash);
console.log("\nParts in fresh hash:", freshHash.split("$").length, "(should be 6)");
