import { products } from "@/data/products";

export function getProductById(id: string) {
  return products.find(
    (product) => product.id === id
  );
}

export function getProductBySlug(slug: string) {
  return products.find(
    (product) => product.slug === slug
  );
}

export function getFeaturedProducts() {
  return products.filter(
    (product) => product.featured
  );
}

export function getPopularProducts() {
  return products.filter(
    (product) => product.popular ?? product.featured
  );
}

export function getProductsByCategory(
  category: string
) {
  return products.filter(
    (product) => product.category === category
  );
}

export function getProductsByBrand(
  brand: string
) {
  return products.filter(
    (product) =>
      product.brand.toLowerCase() ===
      brand.toLowerCase()
  );
}

export function getRelatedProducts(
  productId: string,
  limit = 4
) {
  const product = getProductById(productId);

  if (!product) {
    return [];
  }

  return products
    .filter(
      (item) =>
        item.id !== product.id &&
        (
          item.category === product.category ||
          item.brand === product.brand
        )
    )
    .slice(0, limit);
}