type RatedProduct = {
  id: string;
  rating: number;
  reviews: number;
};

type ReviewAggregate = {
  _avg: { rating: number | null };
  _count: { _all: number };
};

export function combineProductReviewSummary(
  product: RatedProduct,
  aggregate: ReviewAggregate
): Pick<RatedProduct, "rating" | "reviews"> {
  const catalogReviewCount = Math.max(0, product.reviews);
  const customerReviewCount = aggregate._count._all;
  const totalReviewCount = catalogReviewCount + customerReviewCount;

  if (customerReviewCount === 0 || totalReviewCount === 0) {
    return { rating: product.rating, reviews: totalReviewCount };
  }

  const customerRatingTotal =
    (aggregate._avg.rating ?? 0) * customerReviewCount;

  return {
    rating:
      (product.rating * catalogReviewCount + customerRatingTotal) /
      totalReviewCount,
    reviews: totalReviewCount,
  };
}
