import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";

import {
  createPayHereCheckoutFields,
  verifyPayHereNotificationSignature,
} from "../src/lib/payhere-core";

function md5(value: string): string {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}

describe("payment configuration", () => {
  test("creates PayHere hosted-checkout fields with the expected signature", () => {
    const config = {
      merchantId: "123456",
      merchantSecret: "test-merchant-secret",
      siteOrigin: "https://shop.example.test",
      checkoutUrl: "https://sandbox.payhere.lk/pay/checkout",
    };
    const fields = createPayHereCheckoutFields(config, {
      orderId: "order-id",
      orderNumber: "PRZ-TEST-ORDER",
      amount: 12_500,
      currency: "LKR",
      customer: {
        name: "Ada Lovelace",
        email: "ada@example.test",
        phone: "+94770000000",
        address: "1 Test Street",
        city: "Colombo",
      },
    });

    assert.equal(fields.amount, "12500.00");
    assert.equal(fields.currency, "LKR");
    assert.equal(fields.country, "Sri Lanka");
    assert.equal(fields.address, "1 Test Street");
    assert.equal(
      fields.hash,
      md5(`123456PRZ-TEST-ORDER12500.00LKR${md5("test-merchant-secret")}`)
    );
    assert.equal(
      fields.notify_url,
      "https://shop.example.test/api/payments/payhere/notify"
    );
  });

  test("verifies signed PayHere server notifications and rejects altered amounts", () => {
    const config = {
      merchantId: "123456",
      merchantSecret: "test-merchant-secret",
    };
    const notification = {
      merchantId: "123456",
      orderId: "PRZ-TEST-ORDER",
      amount: "12500.00",
      currency: "LKR",
      statusCode: "2",
    };
    const signature = md5(
      `${notification.merchantId}${notification.orderId}${notification.amount}${notification.currency}${notification.statusCode}${md5("test-merchant-secret")}`
    );

    assert.equal(
      verifyPayHereNotificationSignature(config, {
        ...notification,
        signature,
      }),
      true
    );
    assert.equal(
      verifyPayHereNotificationSignature(config, {
        ...notification,
        amount: "12501.00",
        signature,
      }),
      false
    );
  });
});
