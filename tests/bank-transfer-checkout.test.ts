import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseCheckoutInput } from "../src/lib/checkout-validation";
import {
  getSafeReceiptFilename,
  MAX_PAYMENT_RECEIPT_BYTES,
  validatePaymentReceipt,
} from "../src/lib/receipt-validation";

function checkoutInput(paymentMethod: string) {
  return {
    customer: {
      firstName: "Test",
      lastName: "Customer",
      phone: "0700000000",
      email: "test@example.test",
      address: "",
      city: "",
      district: "",
      postalCode: "",
    },
    items: [{ productId: "product-1", quantity: 1 }],
    deliveryMethod: "pickup",
    paymentMethod,
  };
}

describe("bank-transfer checkout validation", () => {
  test("allows bank transfer and cash on delivery, but rejects card checkout", () => {
    assert.equal(parseCheckoutInput(checkoutInput("bank")).paymentMethod, "bank");
    assert.equal(parseCheckoutInput(checkoutInput("cod")).paymentMethod, "cod");
    assert.throws(
      () => parseCheckoutInput(checkoutInput("card")),
      /Invalid payment method/
    );
  });

  test("accepts supported receipt formats only when their signatures match", () => {
    assert.equal(
      validatePaymentReceipt(
        Uint8Array.from([0xff, 0xd8, 0xff, 0x00]),
        "image/jpeg"
      )?.extension,
      "jpg"
    );
    assert.equal(
      validatePaymentReceipt(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png"
      )?.extension,
      "png"
    );
    assert.equal(
      validatePaymentReceipt(
        Uint8Array.from([...Buffer.from("%PDF-1.7")]),
        "application/pdf"
      )?.extension,
      "pdf"
    );
    assert.equal(
      validatePaymentReceipt(
        Uint8Array.from([...Buffer.from("MZ"), 0, 0, 0, 0]),
        "application/pdf"
      ),
      null
    );
    assert.equal(
      validatePaymentReceipt(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47]),
        "image/jpeg"
      ),
      null
    );
    assert.equal(
      validatePaymentReceipt(
        new Uint8Array(MAX_PAYMENT_RECEIPT_BYTES + 1),
        "image/png"
      ),
      null
    );
  });

  test("keeps uploaded filenames safe for metadata display", () => {
    assert.equal(
      getSafeReceiptFilename("..\\..\\bank receipt?.pdf"),
      "bank_receipt_.pdf"
    );
    assert.equal(getSafeReceiptFilename(""), "payment-receipt");
  });
});
