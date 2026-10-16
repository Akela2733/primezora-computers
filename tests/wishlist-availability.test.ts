import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  reconcileWishlistProducts,
  removeWishlistProducts,
} from "../src/lib/wishlist-availability";
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
      [
        {
          id: refreshedProduct.id,
          inStock: true,
          stockQuantity: 9,
          product: refreshedProduct,
        },
      ]
    );

    assert.deepEqual(result, [{ ...refreshedProduct, stock: 9 }]);
  });

  test("keeps disabled products in the wishlist using their current availability", () => {
    const disabledProduct = product("disabled", {
      inStock: false,
      stockQuantity: 0,
    });
    const result = reconcileWishlistProducts(
      [product("disabled", { inStock: true, stockQuantity: 5 })],
      [
        {
          id: disabledProduct.id,
          inStock: false,
          stockQuantity: 0,
          product: disabledProduct,
        },
      ]
    );

    assert.deepEqual(result, [{ ...disabledProduct, stock: 0 }]);
    assert.equal(result[0].inStock, false);
  });

  test("uses the availability fields returned by the database over stale saved product fields", () => {
    const databaseProduct = product("geforce-rtx", {
      inStock: false,
      stockQuantity: 0,
    });
    const result = reconcileWishlistProducts(
      [
        product("geforce-rtx", {
          inStock: false,
          stockQuantity: 0,
        }),
      ],
      [
        {
          id: databaseProduct.id,
          inStock: true,
          stockQuantity: 9,
          product: databaseProduct,
        },
      ]
    );

    assert.equal(result[0].inStock, true);
    assert.equal(result[0].stockQuantity, 9);
    assert.equal(result[0].stock, 9);
  });

  test("removes products added to the cart while preserving other saved products", () => {
    const saved = [product("added"), product("still-wanted")];

    assert.deepEqual(
      removeWishlistProducts(saved, ["added"]),
      [product("still-wanted")]
    );
  });
});
