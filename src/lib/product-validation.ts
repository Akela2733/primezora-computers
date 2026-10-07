import { INPUT_LIMITS, exceedsTextLimit } from "@/lib/input-limits";

export type ProductWriteInput = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviews: number;
  image: string;
  badge: string | null;
  stockQuantity: number;
  featured: boolean;
  inStock: boolean;
};

type ProductDefaults = Partial<ProductWriteInput>;

export type ProductValidationResult =
  | { success: true; data: ProductWriteInput }
  | { success: false; error: string };

const MAX_DATABASE_INT = INPUT_LIMITS.checkout.databaseInteger;

function parseNonNegativeInteger(
  value: unknown
): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isSafeInteger(numberValue) ||
    numberValue < 0 ||
    numberValue > MAX_DATABASE_INT
  ) {
    return null;
  }

  return numberValue;
}

function parseNullableString(
  value: unknown,
  fallback: string | null | undefined
): string | null | undefined {
  if (value === undefined) {
    return fallback;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim() || null;
}

export function validateProductInput(
  value: unknown,
  defaults: ProductDefaults = {}
): ProductValidationResult {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {
      success: false,
      error: "Invalid product data.",
    };
  }

  const body = value as Record<string, unknown>;
  const textFields = [
    ["name", "Product name", INPUT_LIMITS.product.name],
    ["slug", "Product slug", INPUT_LIMITS.product.slug],
    ["brand", "Brand", INPUT_LIMITS.product.brand],
    ["category", "Category", INPUT_LIMITS.product.category],
    ["description", "Description", INPUT_LIMITS.product.description],
    ["image", "Product image", INPUT_LIMITS.product.image],
    ["badge", "Badge", INPUT_LIMITS.product.badge],
  ] as const;

  for (const [field, label, maximum] of textFields) {
    const fieldValue = body[field];
    if (
      typeof fieldValue === "string" &&
      exceedsTextLimit(fieldValue, maximum)
    ) {
      return {
        success: false,
        error: `${label} cannot exceed ${maximum} characters.`,
      };
    }
  }

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";
  const slug =
    typeof body.slug === "string"
      ? body.slug.trim().toLowerCase()
      : "";
  const brand =
    typeof body.brand === "string"
      ? body.brand.trim()
      : "";
  const category =
    typeof body.category === "string"
      ? body.category.trim()
      : "";
  const image =
    typeof body.image === "string"
      ? body.image.trim()
      : "";

  if (!name) {
    return { success: false, error: "Product name is required." };
  }
  if (!slug) {
    return { success: false, error: "Product slug is required." };
  }
  if (!brand) {
    return { success: false, error: "Brand is required." };
  }
  if (!category) {
    return { success: false, error: "Category is required." };
  }
  if (!image) {
    return { success: false, error: "Product image is required." };
  }

  const price = parseNonNegativeInteger(body.price);
  if (price === null) {
    return {
      success: false,
      error: "Price must be a non-negative integer.",
    };
  }

  const stockQuantity = parseNonNegativeInteger(
    body.stockQuantity
  );
  if (stockQuantity === null) {
    return {
      success: false,
      error: "Stock quantity must be a non-negative integer.",
    };
  }

  let oldPrice = defaults.oldPrice ?? null;
  if (body.oldPrice !== undefined) {
    if (
      body.oldPrice === null ||
      (typeof body.oldPrice === "string" &&
        body.oldPrice.trim() === "")
    ) {
      oldPrice = null;
    } else {
      oldPrice = parseNonNegativeInteger(body.oldPrice);
      if (oldPrice === null) {
        return {
          success: false,
          error: "Old price must be a non-negative integer.",
        };
      }
    }
  }

  const description = parseNullableString(
    body.description,
    defaults.description ?? null
  );
  const badge = parseNullableString(
    body.badge,
    defaults.badge ?? null
  );
  if (description === undefined || badge === undefined) {
    return {
      success: false,
      error: "Description and badge must be text.",
    };
  }

  let rating = defaults.rating ?? 0;
  if (body.rating !== undefined) {
    if (
      typeof body.rating !== "number" ||
      !Number.isFinite(body.rating) ||
      body.rating < 0 ||
      body.rating > 5
    ) {
      return {
        success: false,
        error: "Rating must be between 0 and 5.",
      };
    }
    rating = body.rating;
  }

  let reviews = defaults.reviews ?? 0;
  if (body.reviews !== undefined) {
    const parsedReviews = parseNonNegativeInteger(body.reviews);
    if (parsedReviews === null) {
      return {
        success: false,
        error: "Review count must be a non-negative integer.",
      };
    }
    reviews = parsedReviews;
  }

  const featured =
    body.featured === undefined
      ? defaults.featured ?? false
      : body.featured;
  const requestedInStock =
    body.inStock === undefined
      ? defaults.inStock ?? true
      : body.inStock;

  if (
    typeof featured !== "boolean" ||
    typeof requestedInStock !== "boolean"
  ) {
    return {
      success: false,
      error: "Featured and availability must be boolean values.",
    };
  }

  const inStock = stockQuantity > 0 && requestedInStock;

  return {
    success: true,
    data: {
      name,
      slug,
      brand,
      category,
      description,
      price,
      oldPrice,
      rating,
      reviews,
      image,
      badge,
      stockQuantity,
      featured,
      inStock,
    },
  };
}