import assert from "node:assert/strict";
import { test } from "node:test";

import { uploadProductImage } from "../src/lib/storage";

test("creates a missing public Supabase bucket and retries the upload", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET,
  };
  const requests: Array<{ url: string; init?: RequestInit }> = [];

  process.env.SUPABASE_URL = "https://storage-test.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  process.env.SUPABASE_STORAGE_BUCKET = "test-images";

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/storage/v1/bucket")) {
      return new Response(null, { status: 200 });
    }
    if (requests.filter((request) => request.url.includes("/storage/v1/object/")).length === 1) {
      return new Response(JSON.stringify({ message: "Bucket not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: 200 });
  };

  try {
    const result = await uploadProductImage(
      Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      "image/jpeg",
      "categories"
    );

    assert.equal(result.success, true);
    assert.equal(result.provider, "supabase");
    assert.match(result.url ?? "", /\/test-images\/categories\//);
    assert.equal(requests.length, 3);

    const bucketRequest = requests.find((request) =>
      request.url.endsWith("/storage/v1/bucket")
    );
    assert.ok(bucketRequest);
    assert.equal(bucketRequest.init?.method, "POST");
    assert.deepEqual(JSON.parse(String(bucketRequest.init?.body)), {
      id: "test-images",
      name: "test-images",
      public: true,
      file_size_limit: 5 * 1024 * 1024,
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnvironment.url === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalEnvironment.url;
    }
    if (originalEnvironment.serviceKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnvironment.serviceKey;
    }
    if (originalEnvironment.bucket === undefined) {
      delete process.env.SUPABASE_STORAGE_BUCKET;
    } else {
      process.env.SUPABASE_STORAGE_BUCKET = originalEnvironment.bucket;
    }
  }
});
