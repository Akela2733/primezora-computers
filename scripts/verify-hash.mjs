// Verify the new hash works correctly
import { scrypt, timingSafeEqual } from "node:crypto";

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

const newHash = "scrypt$32768$8$1$P5lxBGByNMkzwKOQsiWRjw$bZ9OdVFo34oUDSlxiRv0c-RdKVb5SEpKES9dIV4rD-oYVPDG-cKvem7IUmAqrTa9t3XGNv6ULQ-PjuWN9m_62w";
const [, , , , saltB64, hashB64] = newHash.split("$");
const salt = Buffer.from(saltB64, "base64url");
const expected = Buffer.from(hashB64, "base64url");

const actual = await deriveKey("Admin@Primezora2026", salt);
const match = timingSafeEqual(actual, expected);
console.log("Password 'Admin@Primezora2026' matches new hash:", match);

// Also verify wrong password does NOT match
const actualWrong = await deriveKey("WrongPassword123", salt);
const wrongMatch = timingSafeEqual(actualWrong, expected);
console.log("Wrong password matches new hash (should be false):", wrongMatch);

console.log(match && !wrongMatch ? "\n✅ PASS — hash is correct." : "\n❌ FAIL — something is wrong.");
