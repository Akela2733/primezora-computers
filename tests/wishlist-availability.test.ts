import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { reconcileWishlistProducts } from "../src/lib/wishlist-availability";
import type { Product } from "../src/types/product";

function product(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name: `Product ${id}`,
    slug: id,
    brand: "Primezora",
    category: "Components",
    price: 100,
    rating: 0,
    reviews: 0,
    image: "/product.png",
    inStock: true,
    stockQuantity: 3,
    ...overrides,
  };
}

describe("wishlist product availability", () => {
  test("removes deleted products and refreshes saved product details", () => {
    const refreshedProduct = product("still-listed", {
      price: 125,
      stockQuantity: 9,
    });
    const result = reconcileWishlistProducts(
      [product("deleted"), product("still-listed", { price: 100 })],
      [{ id: refreshedProduct.id, product: refreshedProduct }]
    );

    assert.deepEqual(result, [refreshedProduct]);
  });

  test("keeps disabled products in the wishlist using their current availability", () => {
    const disabledProduct = product("disabled", {
      inStock: false,
      stockQuantity: 0,
    });
    const result = reconcileWishlistProducts(
      [product("disabled", { inStock: true, stockQuantity: 5 })],
      [{ id: disabledProduct.id, product: disabledProduct }]
    );

    assert.deepEqual(result, [disabledProduct]);
    assert.equal(result[0].inStock, false);
  });
});
