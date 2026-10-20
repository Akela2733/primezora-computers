import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { normalizeCategorySlug } from "../src/lib/category-normalization";

describe("category normalization", () => {
  test("treats Computer Parts and PC Components as the same category", () => {
    assert.equal(normalizeCategorySlug("Computer Parts"), "pc-components");
    assert.equal(normalizeCategorySlug("PC Components"), "pc-components");
    assert.equal(normalizeCategorySlug("computer-parts"), "pc-components");
  });

  test("keeps unrelated category names distinct", () => {
    assert.equal(normalizeCategorySlug("Gaming"), "gaming");
    assert.notEqual(
      normalizeCategorySlug("Gaming"),
      normalizeCategorySlug("Computer Parts")
    );
  });
});
