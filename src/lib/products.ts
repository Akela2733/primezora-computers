import { products, type Product } from "@/data/products";

export type ProductFilters = {
  search: string;
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sort: string;
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: "",
  category: "All",
  brand: "All",
  minPrice: 0,
  maxPrice: 500000,
  inStockOnly: false,
  sort: "featured",
};

export function getAllProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getProductBySlug(
  slug: string
): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}

export function getSaleProducts(): Product[] {
  return products.filter((product) => product.oldPrice);
}

export function getNewProducts(): Product[] {
  return products.filter((product) => product.badge === "NEW");
}

export function getRelatedProducts(
  product: Product,
  limit = 4
): Product[] {
  return products
    .filter((item) => item.id !== product.id)
    .filter(
      (item) =>
        item.category === product.category ||
        item.brand === product.brand
    )
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured)
    )
    .slice(0, limit);
}

export function getCategories(): string[] {
  return [
    "All",
    ...Array.from(
      new Set(products.map((product) => product.category))
    ),
  ];
}

export function getBrands(): string[] {
  return [
    "All",
    ...Array.from(
      new Set(products.map((product) => product.brand))
    ),
  ];
}

export function filterProducts(
  sourceProducts: Product[],
  filters: ProductFilters
): Product[] {
  const search = filters.search.trim().toLowerCase();

  const result = sourceProducts.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.brand.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      (product.tags?.some((tag) =>
        tag.toLowerCase().includes(search)
      ) ?? false);

    const matchesCategory =
      filters.category === "All" ||
      product.category === filters.category;

    const matchesBrand =
      filters.brand === "All" ||
      product.brand === filters.brand;

    const matchesPrice =
      product.price >= filters.minPrice &&
      product.price <= filters.maxPrice;

    const matchesStock =
      !filters.inStockOnly || product.inStock;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesBrand &&
      matchesPrice &&
      matchesStock
    );
  });

  switch (filters.sort) {
    case "price-low":
      result.sort((a, b) => a.price - b.price);
      break;

    case "price-high":
      result.sort((a, b) => b.price - a.price);
      break;

    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;

    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      );
      break;

    case "featured":
    default:
      result.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured)
      );
      break;
  }

  return result;
}