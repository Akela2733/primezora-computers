import type { Product } from "@/types/product";

export type AvailableWishlistProduct = {
  id: string;
  product: Product;
};

export function reconcileWishlistProducts(
  items: Product[],
  availableProducts: readonly AvailableWishlistProduct[]
): Product[] {
  const productsById = new Map(
    availableProducts.map(({ id, product }) => [id, product])
  );

  return items.flatMap((item) => {
    const currentProduct = productsById.get(item.id);
    return currentProduct ? [currentProduct] : [];
  });
}
