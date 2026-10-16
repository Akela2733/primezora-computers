import type { Product } from "@/types/product";

export type AvailableWishlistProduct = {
  id: string;
  inStock: boolean;
  stockQuantity: number;
  product: Product;
};

export function reconcileWishlistProducts(
  items: Product[],
  availableProducts: readonly AvailableWishlistProduct[]
): Product[] {
  const productsById = new Map(
    availableProducts.map((availableProduct) => [
      availableProduct.id,
      availableProduct,
    ])
  );

  return items.flatMap((item) => {
    const current = productsById.get(item.id);
    return current
      ? [
          {
            ...current.product,
            inStock: current.inStock,
            stockQuantity: current.stockQuantity,
            stock: current.stockQuantity,
          },
        ]
      : [];
  });
}
