import assert from "node:assert/strict";
import test from "node:test";

import { combineProductReviewSummary } from "../src/lib/product-review-summary-core";

test("product review summaries", async (t) => {
  await t.test("combines customer ratings with existing catalog ratings", () => {
    assert.deepEqual(
      combineProductReviewSummary(
        { id: "product-1", rating: 4, reviews: 2 },
        { _avg: { rating: 5 }, _count: { _all: 1 } }
      ),
      { rating: 13 / 3, reviews: 3 }
    );
  });

  await t.test("preserves catalog ratings when no customer reviews exist", () => {
    assert.deepEqual(
      combineProductReviewSummary(
        { id: "product-1", rating: 4.5, reviews: 8 },
        { _avg: { rating: null }, _count: { _all: 0 } }
      ),
      { rating: 4.5, reviews: 8 }
    );
  });

  await t.test("uses customer ratings when there is no catalog baseline", () => {
    assert.deepEqual(
      combineProductReviewSummary(
        { id: "product-1", rating: 0, reviews: 0 },
        { _avg: { rating: 3.5 }, _count: { _all: 2 } }
      ),
      { rating: 3.5, reviews: 2 }
    );
  });
});
