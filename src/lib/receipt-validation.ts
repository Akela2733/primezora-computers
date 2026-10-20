export const MAX_PAYMENT_RECEIPT_BYTES = 10 * 1024 * 1024;

const RECEIPT_TYPES = {
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": {
    extension: "png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  "image/webp": { extension: "webp", signature: [] },
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
} as const;

export type ValidatedReceipt = {
  contentType: keyof typeof RECEIPT_TYPES;
  extension: string;
};

export function validatePaymentReceipt(
  buffer: Uint8Array,
  declaredContentType: string
): ValidatedReceipt | null {
  const contentType = declaredContentType.trim().toLowerCase();
  if (
    buffer.length === 0 ||
    buffer.length > MAX_PAYMENT_RECEIPT_BYTES ||
    !(contentType in RECEIPT_TYPES)
  ) {
    return null;
  }

  const fileType = RECEIPT_TYPES[contentType as keyof typeof RECEIPT_TYPES];
  if (contentType === "image/webp") {
    if (
      buffer.length < 12 ||
      buffer[0] !== 0x52 ||
      buffer[1] !== 0x49 ||
      buffer[2] !== 0x46 ||
      buffer[3] !== 0x46 ||
      buffer[8] !== 0x57 ||
      buffer[9] !== 0x45 ||
      buffer[10] !== 0x42 ||
      buffer[11] !== 0x50
    ) {
      return null;
    }
  } else if (
    buffer.length < fileType.signature.length ||
    !fileType.signature.every((byte, index) => buffer[index] === byte)
  ) {
    return null;
  }

  return {
    contentType: contentType as keyof typeof RECEIPT_TYPES,
    extension: fileType.extension,
  };
}

export function getSafeReceiptFilename(value: string): string {
  const basename = value.split(/[\\/]/).pop()?.trim() ?? "";
  const safe = basename
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 100);
  return safe || "payment-receipt";
}
