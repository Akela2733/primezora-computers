export const ADMIN_SESSION_COOKIE = "primezora_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const encoder = new TextEncoder();

type SessionPayload = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function getConfiguration() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !secret || encoder.encode(secret).length < 32) {
    return null;
  }

  return { email, secret };
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminSessionToken(
  email: string
): Promise<string> {
  const configuration = getConfiguration();
  if (!configuration) {
    throw new Error("Admin authentication is not configured.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    issuedAt,
    expiresAt: issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encodeBase64Url(
    encoder.encode(JSON.stringify(payload))
  );
  const key = await getHmacKey(configuration.secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<boolean> {
  const configuration = getConfiguration();
  if (!configuration || !token || token.length > 2048) {
    return false;
  }

  try {
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra !== undefined) {
      return false;
    }

    const key = await getHmacKey(configuration.secret);
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature) as BufferSource,
      encoder.encode(encodedPayload) as BufferSource
    );
    if (!validSignature) return false;

    const payload: unknown = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload))
    );
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("email" in payload) ||
      !("issuedAt" in payload) ||
      !("expiresAt" in payload)
    ) {
      return false;
    }

    const session = payload as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    return (
      session.email === configuration.email &&
      Number.isSafeInteger(session.issuedAt) &&
      Number.isSafeInteger(session.expiresAt) &&
      session.issuedAt <= now + 60 &&
      session.expiresAt > now &&
      session.expiresAt - session.issuedAt <=
        ADMIN_SESSION_MAX_AGE_SECONDS
    );
  } catch {
    return false;
  }
}