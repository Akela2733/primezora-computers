import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

import { POST as requestAdminRecovery } from "../src/app/api/auth/admin/forgot/route";
import { POST as applyAdminReset } from "../src/app/api/auth/admin/reset/route";

const originalAdminEmail = process.env.ADMIN_EMAIL;
const originalPasswordHash = process.env.ADMIN_PASSWORD_HASH;

after(() => {
  if (originalAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = originalAdminEmail;

  if (originalPasswordHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
  else process.env.ADMIN_PASSWORD_HASH = originalPasswordHash;
});

describe("admin password recovery", () => {
  test("recovery never returns a reset token or reveals whether the email is configured", async () => {
    process.env.ADMIN_EMAIL = "admin@example.test";

    const matchingResponse = await requestAdminRecovery();
    const matchingBody = await matchingResponse.json();

    delete process.env.ADMIN_EMAIL;
    const unknownResponse = await requestAdminRecovery();
    const unknownBody = await unknownResponse.json();

    assert.equal(matchingResponse.status, 403);
    assert.equal(unknownResponse.status, 403);
    assert.deepEqual(matchingBody, unknownBody);
    assert.doesNotMatch(JSON.stringify(matchingBody), /token|admin@example\.test/i);
  });

  test("reset endpoint rejects reset attempts without changing configured credentials", async () => {
    process.env.ADMIN_PASSWORD_HASH = "existing-configured-hash";

    const response = await applyAdminReset();
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(process.env.ADMIN_PASSWORD_HASH, "existing-configured-hash");
    assert.doesNotMatch(JSON.stringify(body), /token|password|hash/i);
  });
});
