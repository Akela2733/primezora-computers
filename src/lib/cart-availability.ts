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
    if (
      !current ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return [];
    }

    const quantity =
      current.stockQuantity > 0
        ? Math.min(item.quantity, current.stockQuantity)
        : item.quantity;

    return [
      {
        ...item,
        product: {
          ...(current.product ?? item.product),
          inStock: current.inStock,
          stockQuantity: current.stockQuantity,
          stock: current.stockQuantity,
        },
        quantity,
      },
    ];
  });
}
