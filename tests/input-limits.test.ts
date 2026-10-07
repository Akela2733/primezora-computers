import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseCheckoutInput } from "../src/lib/checkout-validation";
import {
  findOverLimitQueryParameter,
  INPUT_LIMITS,
} from "../src/lib/input-limits";
import { validateProductInput } from "../src/lib/product-validation";

function checkoutInput(): Record<string, unknown> {
  return {
    customer: {
      firstName: "A",
      lastName: "B",
      phone: "123",
      email: "customer@example.com",
      address: "123 Main Street",
      city: "Colombo",
      district: "Colombo",
      postalCode: "00100",
    },
    items: [{ productId: "test-product", quantity: 1 }],
    deliveryMethod: "delivery",
    paymentMethod: "cod",
  };
}

function setCheckoutField(
  input: Record<string, unknown>,
  field: string,
  value: string
): void {
  const customer = input.customer as Record<string, unknown>;
  customer[field] = value;
}

function emailOfLength(length: number): string {
  return `${"a".repeat(length - 6)}@x.com`;
}

function productInput(): Record<string, unknown> {
  return {
    name: "Test product",
    slug: "test-product",
    brand: "Test brand",
    category: "Test category",
    description: "Test description",
    price: 1,
    oldPrice: null,
    rating: 0,
    reviews: 0,
    image: "/test/product.png",
    badge: null,
    stockQuantity: 1,
    featured: false,
    inStock: true,
  };
}

describe("checkout text input limits", () => {
  const fields = [
    ["firstName", INPUT_LIMITS.customer.firstName],
    ["lastName", INPUT_LIMITS.customer.lastName],
    ["phone", INPUT_LIMITS.customer.phone],
    ["email", INPUT_LIMITS.customer.email],
    ["address", INPUT_LIMITS.customer.address],
    ["city", INPUT_LIMITS.customer.city],
    ["district", INPUT_LIMITS.checkout.district],
    ["postalCode", INPUT_LIMITS.customer.postalCode],
  ] as const;

  for (const [field, maximum] of fields) {
    test(`${field} accepts limit - 1 and limit, rejects limit + 1`, () => {
      for (const length of [maximum - 1, maximum]) {
        const input = checkoutInput();
        setCheckoutField(
          input,
          field,
          field === "email" ? emailOfLength(length) : "x".repeat(length)
        );
        assert.doesNotThrow(() => parseCheckoutInput(input));
      }

      const oversized = checkoutInput();
      setCheckoutField(
        oversized,
        field,
        field === "email"
          ? emailOfLength(maximum + 1)
          : "x".repeat(maximum + 1)
      );
      assert.throws(() => parseCheckoutInput(oversized), {
        message: new RegExp("cannot exceed"),
      });
    });
  }

  test("checkout product IDs reject values above the configured maximum", () => {
    for (const length of [
      INPUT_LIMITS.checkout.productId - 1,
      INPUT_LIMITS.checkout.productId,
    ]) {
      const input = checkoutInput();
      input.items = [{ productId: "x".repeat(length), quantity: 1 }];
      assert.doesNotThrow(() => parseCheckoutInput(input));
    }

    const input = checkoutInput();
    input.items = [
      {
        productId: "x".repeat(INPUT_LIMITS.checkout.productId + 1),
        quantity: 1,
      },
    ];
    assert.throws(() => parseCheckoutInput(input), {
      message: /cannot exceed/,
    });
  });
});

describe("admin product text input limits", () => {
  const fields = [
    ["name", INPUT_LIMITS.product.name],
    ["slug", INPUT_LIMITS.product.slug],
    ["brand", INPUT_LIMITS.product.brand],
    ["category", INPUT_LIMITS.product.category],
    ["description", INPUT_LIMITS.product.description],
    ["image", INPUT_LIMITS.product.image],
    ["badge", INPUT_LIMITS.product.badge],
  ] as const;

  for (const [field, maximum] of fields) {
    test(`${field} accepts limit - 1 and limit, rejects limit + 1`, () => {
      for (const length of [maximum - 1, maximum]) {
        const input = productInput();
        input[field] = "x".repeat(length);
        const result = validateProductInput(input);
        assert.equal(result.success, true);
      }

      const oversized = productInput();
      oversized[field] = "x".repeat(maximum + 1);
      const result = validateProductInput(oversized);
      assert.equal(result.success, false);
      if (!result.success) assert.match(result.error, /cannot exceed/);
    });
  }
});

describe("catalog query parameter limits", () => {
  const fields = [
    ["search", INPUT_LIMITS.catalog.search],
    ["category", INPUT_LIMITS.catalog.category],
    ["brand", INPUT_LIMITS.catalog.brand],
    ["featured", INPUT_LIMITS.catalog.featured],
    ["inStock", INPUT_LIMITS.catalog.inStock],
    ["q", INPUT_LIMITS.product.search],
  ] as const;

  for (const [parameter, maximum] of fields) {
    test(`${parameter} accepts limit - 1 and limit, rejects limit + 1`, () => {
      for (const length of [maximum - 1, maximum]) {
        const params = new URLSearchParams({
          [parameter]: "x".repeat(length),
        });
        assert.equal(
          findOverLimitQueryParameter(params, { [parameter]: maximum }),
          null
        );
      }

      const params = new URLSearchParams({
        [parameter]: "x".repeat(maximum + 1),
      });
      assert.equal(
        findOverLimitQueryParameter(params, { [parameter]: maximum }),
        parameter
      );
    });
  }

  test("admin customer search rejects values above the configured maximum", () => {
    const maximum = INPUT_LIMITS.customer.search;

    for (const length of [maximum - 1, maximum]) {
      const params = new URLSearchParams({ q: "x".repeat(length) });
      assert.equal(
        findOverLimitQueryParameter(params, { q: maximum }),
        null
      );
    }

    const params = new URLSearchParams({
      q: "x".repeat(maximum + 1),
    });
    assert.equal(
      findOverLimitQueryParameter(params, { q: maximum }),
      "q"
    );
  });
});
