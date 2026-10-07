import type {
  Product,
  ProductSpecification,
} from "@/types/product";

type ProductRecord = {
  id: string;
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
  images: string[];
  badge: string | null;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  specifications: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function parseSpecifications(
  value: unknown
): ProductSpecification[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      Array.isArray(entry)
    ) {
      return [];
    }

    const specification =
      entry as Record<string, unknown>;

    if (
      typeof specification.label !== "string" ||
      typeof specification.value !== "string"
    ) {
      return [];
    }

    return [{
      label: specification.label,
      value: specification.value,
    }];
  });
}

export function toProductView(
  product: ProductRecord
): Product {
  const images = product.images.filter(
    (image) => image.trim().length > 0
  );

  if (product.image && !images.includes(product.image)) {
    images.unshift(product.image);
  }

  return {
    ...product,
    images,
    specifications: parseSpecifications(
      product.specifications
    ),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}