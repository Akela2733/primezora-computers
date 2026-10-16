import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { reconcileCartItems } from "../src/lib/cart-availability";
import type { Product } from "../src/types/product";

function cartItem(id: string, quantity = 2) {
  const product: Product = {
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
    stockQuantity: 10,
  };
  return { product, quantity };
}

describe("cart product availability", () => {
  test("removes deleted, disabled, and zero-stock products", () => {
    const items = [
      cartItem("available"),
      cartItem("disabled"),
      cartItem("empty"),
      cartItem("deleted"),
    ];

    const result = reconcileCartItems(items, [
      { id: "available", inStock: true, stockQuantity: 4 },
      { id: "disabled", inStock: false, stockQuantity: 5 },
      { id: "empty", inStock: false, stockQuantity: 0 },
    ]);

    assert.deepEqual(
      result.map((item) => item.product.id),
      ["available"]
    );
  });

  test("updates stock and clamps saved cart quantities to current inventory", () => {
    const result = reconcileCartItems([cartItem("available", 7)], [
      { id: "available", inStock: true, stockQuantity: 3 },
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].quantity, 3);
    assert.equal(result[0].product.stockQuantity, 3);
    assert.equal(result[0].product.stock, 3);
    assert.equal(result[0].product.inStock, true);
  });

  test("does not include invalid or unavailable products", () => {
    const result = reconcileCartItems(
      [cartItem("available", 0), cartItem("unavailable")],
      [{ id: "unavailable", inStock: true, stockQuantity: 0 }]
    );

    assert.deepEqual(result, []);
  });
});
