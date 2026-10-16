export const PRODUCT_REVIEW_MAX_LENGTH = 3_000;

export type ProductReviewInput = {
  rating: number;
  content: string;
};

export function parseProductReviewInput(
  value: unknown
): ProductReviewInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  if (
    typeof input.rating !== "number" ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5 ||
    typeof input.content !== "string"
  ) {
    return null;
  }

  const content = input.content.trim();
  if (content.length === 0 || content.length > PRODUCT_REVIEW_MAX_LENGTH) {
    return null;
  }

  return { rating: input.rating, content };
}
