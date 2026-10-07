export const CUSTOMER_SESSION_COOKIE = "primezora_customer_session";
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

const encoder = new TextEncoder();

type SessionPayload = {
  customerId: string;
  authUserId: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret(): string | null {
  const secret = (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET
  )?.trim();
  if (!secret || encoder.encode(secret).length < 32) return null;
  return `customer-session:${secret}`;
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
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createCustomerSessionToken(
  customerId: string,
  authUserId: string,
  email: string
): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Customer session secret is not configured.");

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    customerId,
    authUserId,
    email: email.trim().toLowerCase(),
    issuedAt,
    expiresAt: issuedAt + CUSTOMER_SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = encodeBase64Url(
    encoder.encode(JSON.stringify(payload))
  );
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export type VerifiedCustomerSession = {
  customerId: string;
  authUserId: string;
  email: string;
};

export async function verifyCustomerSessionToken(
  token: string | undefined
): Promise<VerifiedCustomerSession | null> {
  const secret = getSessionSecret();
  if (!secret || !token || token.length > 4096) return null;

  try {
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra !== undefined) return null;

    const key = await getHmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature) as BufferSource,
      encoder.encode(encodedPayload) as BufferSource
    );
    if (!valid) return null;

    const payload: unknown = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload))
    );

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("customerId" in payload) ||
      !("email" in payload) ||
      !("issuedAt" in payload) ||
      !("expiresAt" in payload)
    ) {
      return null;
    }

    const session = payload as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (
      !session.customerId ||
      !session.email ||
      typeof session.issuedAt !== "number" ||
      typeof session.expiresAt !== "number" ||
      !Number.isSafeInteger(session.issuedAt) ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.issuedAt > now + 60 ||
      session.expiresAt <= now ||
      session.expiresAt - session.issuedAt > CUSTOMER_SESSION_MAX_AGE_SECONDS
    ) {
      return null;
    }

    return {
      customerId: session.customerId,
      authUserId: session.authUserId || "",
      email: session.email,
    };
  } catch {
    return null;
  }
}
