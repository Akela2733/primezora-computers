import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { validateProductInput } from "../src/lib/product-validation";

const validProduct = {
  name: "Gaming PC",
  slug: "gaming-pc",
  brand: "Primezora",
  category: "Desktop PCs",
  image: "/uploads/products/main.jpg",
  price: 1200,
  stockQuantity: 3,
};

describe("product input validation", () => {
  test("defaults a missing product gallery to an empty array", () => {
    const result = validateProductInput(validProduct);

    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.images, []);
    }
  });

  test("accepts uploaded gallery image paths and trims whitespace", () => {
    const result = validateProductInput({
      ...validProduct,
      images: [" /uploads/products/side.jpg "],
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.images, ["/uploads/products/side.jpg"]);
    }
  });

  test("preserves existing gallery images when an update omits the gallery", () => {
    const result = validateProductInput(
      validProduct,
      { images: ["/uploads/products/existing.jpg"] }
    );

    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.images, ["/uploads/products/existing.jpg"]);
    }
  });

  test("rejects invalid gallery image values", () => {
    const result = validateProductInput({
      ...validProduct,
      images: [""],
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error, /gallery/);
    }
  });

  test("rejects galleries that exceed the supported image limit", () => {
    const result = validateProductInput({
      ...validProduct,
      images: Array.from({ length: 21 }, (_, index) => `/gallery/${index}.jpg`),
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error, /no more than 20/);
    }
  });
});
