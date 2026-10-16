import assert from "node:assert/strict";
import test from "node:test";

import {
  parseProductReviewInput,
  PRODUCT_REVIEW_MAX_LENGTH,
} from "../src/lib/product-review-validation";

test("product review validation", async (t) => {
  await t.test("accepts and trims a valid review", () => {
    assert.deepEqual(parseProductReviewInput({
      rating: 5,
      content: "  Great product.  ",
    }), {
      rating: 5,
      content: "Great product.",
    });
  });

  await t.test("rejects invalid ratings and review bodies", () => {
    for (const input of [
      { rating: 0, content: "Review" },
      { rating: 6, content: "Review" },
      { rating: 2.5, content: "Review" },
      { rating: "5", content: "Review" },
      { rating: 4, content: "   " },
      { rating: 4, content: "x".repeat(PRODUCT_REVIEW_MAX_LENGTH + 1) },
      null,
      [],
    ]) {
      assert.equal(parseProductReviewInput(input), null);
    }
  });
});
