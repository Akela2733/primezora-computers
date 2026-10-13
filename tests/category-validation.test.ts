import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { validateCategoryInput } from "../src/lib/category-validation";

describe("category input validation", () => {
  test("accepts category fields and normalizes slug case", () => {
    const result = validateCategoryInput({
      name: "PC Components",
      slug: "PC-COMPONENTS",
      description: "Hardware for custom builds.",
      image: "/categories/components.jpg",
    });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data, {
      name: "PC Components",
      slug: "pc-components",
      description: "Hardware for custom builds.",
      image: "/categories/components.jpg",
      isActive: true,
    });
  });

  test("rejects invalid slug characters", () => {
    const result = validateCategoryInput({
      name: "PC Components",
      slug: "PC Components",
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error, /lowercase letters, numbers and hyphens/);
    }
  });

  test("accepts partial status updates without overwriting other fields", () => {
    const result = validateCategoryInput({ isActive: false }, { partial: true });

    assert.deepEqual(result, {
      success: true,
      data: { isActive: false },
    });
  });

  test("rejects unsafe category image URLs", () => {
    const result = validateCategoryInput(
      { image: "javascript:alert(1)" },
      { partial: true }
    );

    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error, /site path or HTTPS URL/);
    }
  });

  test("rejects empty partial updates", () => {
    const result = validateCategoryInput({}, { partial: true });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(result.error, /Provide category fields/);
    }
  });
});
