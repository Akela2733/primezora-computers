import { prisma } from "@/lib/prisma";
import { combineProductReviewSummary } from "@/lib/product-review-summary-core";

export { combineProductReviewSummary } from "@/lib/product-review-summary-core";

type RatedProduct = {
  id: string;
  rating: number;
  reviews: number;
};

export async function addCustomerReviewSummaries<
  T extends RatedProduct,
>(products: T[]): Promise<T[]> {
  if (products.length === 0) return products;

  const aggregates = await prisma.productReview.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map(({ id }) => id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const byProductId = new Map(
    aggregates.map((aggregate) => [aggregate.productId, aggregate])
  );

  return products.map((product) => ({
    ...product,
    ...combineProductReviewSummary(
      product,
      byProductId.get(product.id) ?? { _avg: { rating: null }, _count: { _all: 0 } }
    ),
  }));
}
