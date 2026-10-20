import "server-only";

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { MAX_PAYMENT_RECEIPT_BYTES } from "@/lib/receipt-validation";

const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

let cachedClient: SupabaseClient | undefined;

function getStorageClient(): SupabaseClient {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error(
      "Private receipt storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  cachedClient ??= createClient(url.replace(/\/+$/, ""), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

function getBucketName(): string {
  const bucket =
    process.env.SUPABASE_PAYMENT_RECEIPTS_BUCKET?.trim() ||
    "payment-receipts";
  if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(bucket)) {
    throw new Error("SUPABASE_PAYMENT_RECEIPTS_BUCKET is invalid.");
  }
  return bucket;
}

async function ensurePrivateBucket(client: SupabaseClient, bucket: string) {
  const existing = await client.storage.getBucket(bucket);
  if (!existing.error) {
    if (existing.data.public) {
      throw new Error(
        `The "${bucket}" receipt bucket is public. Configure a private bucket before accepting receipts.`
      );
    }
    return;
  }

  const created = await client.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: MAX_PAYMENT_RECEIPT_BYTES,
    allowedMimeTypes: ALLOWED_RECEIPT_TYPES,
  });
  if (!created.error) return;

  const afterCreate = await client.storage.getBucket(bucket);
  if (afterCreate.error) {
    throw new Error(
      `Unable to create or inspect the private "${bucket}" receipt bucket: ${created.error.message}`
    );
  }
  if (afterCreate.data.public) {
    throw new Error(
      `The "${bucket}" receipt bucket is public. Configure a private bucket before accepting receipts.`
    );
  }
}

export async function uploadPrivatePaymentReceipt(input: {
  orderId: string;
  extension: string;
  contentType: string;
  buffer: Uint8Array;
}): Promise<string> {
  const client = getStorageClient();
  const bucket = getBucketName();
  await ensurePrivateBucket(client, bucket);
  const path = `${input.orderId}/${randomUUID()}.${input.extension}`;
  const { error } = await client.storage
    .from(bucket)
    .upload(path, input.buffer, {
      contentType: input.contentType,
      upsert: false,
    });
  if (error) {
    throw new Error(`Private receipt upload failed: ${error.message}`);
  }
  return path;
}

export async function deletePrivatePaymentReceipt(path: string): Promise<void> {
  const { error } = await getStorageClient()
    .storage.from(getBucketName()).remove([path]);
  if (error) {
    throw new Error(`Private receipt cleanup failed: ${error.message}`);
  }
}

export async function downloadPrivatePaymentReceipt(path: string): Promise<{
  bytes: Uint8Array;
  contentType: string;
}> {
  const { data, error } = await getStorageClient()
    .storage.from(getBucketName()).download(path);
  if (error) {
    throw new Error(`Private receipt download failed: ${error.message}`);
  }
  return {
    bytes: new Uint8Array(await data.arrayBuffer()),
    contentType: data.type || "application/octet-stream",
  };
}
