/**
 * @file src/lib/storage.ts
 *
 * Production-Ready Product Image Storage Architecture for Primezora
 *
 * Security & Reliability Guarantees:
 * 1. Never stores binary image blobs in PostgreSQL (only URL/path string stored).
 * 2. Uses Supabase Storage as primary cloud object storage.
 * 3. Fallback to secure local static storage (`public/uploads/products/`) when Supabase
 *    credentials are not yet configured in local development.
 * 4. Rigorous file validation:
 *    - File size check (max 5 MB)
 *    - MIME type whitelist (JPEG, PNG, WebP, AVIF, GIF — SVG is rejected to prevent XSS)
 *    - Binary magic byte validation to prevent MIME spoofing
 * 5. Safe filename generation (random UUIDs) to eliminate path traversal / directory injection.
 * 6. Service role keys remain exclusively on the server (never exposed to browser).
 */

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  provider: "supabase" | "local";
  error?: string;
}

/**
 * Validates binary magic bytes against declared MIME type to prevent file-spoofing attacks.
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  switch (mimeType) {
    case "image/jpeg":
      // JPEG starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case "image/png":
      // PNG starts with 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case "image/gif":
      // GIF starts with "GIF87a" or "GIF89a" (47 49 46 38)
      return (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
      );

    case "image/webp":
      // WebP starts with "RIFF" (52 49 46 46) and bytes 8..11 are "WEBP" (57 45 42 50)
      return (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );

    case "image/avif":
      // ISO BMFF contains "ftyp" at offset 4 and "avif" or "mif1" in compatible brands
      if (
        buffer[4] === 0x66 &&
        buffer[5] === 0x74 &&
        buffer[6] === 0x79 &&
        buffer[7] === 0x70
      ) {
        const headerSlice = buffer.subarray(8, 24).toString("ascii");
        return (
          headerSlice.includes("avif") ||
          headerSlice.includes("avis") ||
          headerSlice.includes("mif1")
        );
      }
      return false;

    default:
      return false;
  }
}

/**
 * Validates image buffer, size, and MIME type.
 */
export function validateImageFile(
  buffer: Buffer,
  declaredMimeType: string
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty file provided." };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(
        1
      )} MB) exceeds maximum allowed size of 5 MB.`,
    };
  }

  const normalizedMime = declaredMimeType.toLowerCase().trim();
  const extension = ALLOWED_MIME_TYPES[normalizedMime];

  if (!extension) {
    return {
      valid: false,
      error:
        "Unsupported file type. Only JPEG, PNG, WebP, AVIF, and GIF are allowed (SVG is blocked for security).",
    };
  }

  if (!verifyMagicBytes(buffer, normalizedMime)) {
    return {
      valid: false,
      error: "File content does not match the declared image format.",
    };
  }

  return {
    valid: true,
    mimeType: normalizedMime,
    extension,
  };
}

/**
 * Generates an unguessable, path-traversal-proof filename.
 */
export function generateSafeImageFilename(extension: string): string {
  const timestamp = Date.now();
  const uuid = randomUUID().replace(/[^a-zA-Z0-9]/g, "");
  return `prod_${timestamp}_${uuid}${extension}`;
}

/**
 * Returns Supabase configuration if present in environment variables.
 */
export function getSupabaseStorageConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET || "product-images";

  const isConfigured = Boolean(url && serviceKey);

  return {
    url: url.replace(/\/+$/, ""),
    serviceKey,
    bucket,
    isConfigured,
  };
}

/**
 * Uploads an image to Supabase Storage via REST API.
 */
async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; filename: string }> {
  const { url, serviceKey, bucket } = getSupabaseStorageConfig();

  const uploadEndpoint = `${url}/storage/v1/object/${bucket}/products/${filename}`;

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Supabase Storage upload failed with status ${response.status}.`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) errorMessage += ` (${parsed.message})`;
    } catch {
      errorMessage += ` (${errorText})`;
    }
    throw new Error(errorMessage);
  }

  const publicUrl = `${url}/storage/v1/object/public/${bucket}/products/${filename}`;
  return {
    url: publicUrl,
    filename,
  };
}

/**
 * Uploads an image to local public directory (`public/uploads/products/`) as a fallback.
 */
async function uploadToLocalStorage(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; filename: string }> {
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "products"
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/products/${filename}`,
    filename,
  };
}

/**
 * Main server-side upload handler: validates file, generates safe filename,
 * and uploads to Supabase Storage (or local storage fallback).
 */
export async function uploadProductImage(
  buffer: Buffer,
  declaredMimeType: string
): Promise<StorageUploadResult> {
  const validation = validateImageFile(buffer, declaredMimeType);
  if (!validation.valid || !validation.extension || !validation.mimeType) {
    return {
      success: false,
      provider: "local",
      error: validation.error || "Invalid image file.",
    };
  }

  const safeFilename = generateSafeImageFilename(validation.extension);
  const supabaseConfig = getSupabaseStorageConfig();

  if (supabaseConfig.isConfigured) {
    try {
      const uploaded = await uploadToSupabaseStorage(
        buffer,
        safeFilename,
        validation.mimeType
      );
      return {
        success: true,
        url: uploaded.url,
        filename: uploaded.filename,
        provider: "supabase",
      };
    } catch (error) {
      console.error("Supabase Storage upload error:", error);
      return {
        success: false,
        provider: "supabase",
        error:
          error instanceof Error
            ? error.message
            : "Cloud storage upload failed.",
      };
    }
  }

  // Fallback to local storage
  try {
    const uploaded = await uploadToLocalStorage(buffer, safeFilename);
    return {
      success: true,
      url: uploaded.url,
      filename: uploaded.filename,
      provider: "local",
    };
  } catch (error) {
    console.error("Local storage upload error:", error);
    return {
      success: false,
      provider: "local",
      error: "Unable to save image to local storage.",
    };
  }
}
