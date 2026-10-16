import type { Product } from "@/types/product";

export type CartAvailability = {
  id: string;
  inStock: boolean;
  stockQuantity: number;
  product?: Product;
};

export type AvailableCartItem = {
  product: Product;
  quantity: number;
};

export function reconcileCartItems<T extends AvailableCartItem>(
  items: T[],
  availability: readonly CartAvailability[]
): T[] {
  const availabilityById = new Map(
    availability.map((product) => [product.id, product])
  );

  return items.flatMap((item) => {
    const current = availabilityById.get(item.product.id);
    if (!current || !current.inStock || current.stockQuantity <= 0) {
      return [];
    }

    const quantity = Math.min(
      Math.max(1, item.quantity),
      current.stockQuantity
    );

    return [
      {
        ...item,
        product: {
          ...(current.product ?? item.product),
          inStock: true,
          stockQuantity: current.stockQuantity,
          stock: current.stockQuantity,
        },
        quantity,
      },
    ];
  });
}
