export type ProductSpecification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subcategory?: string;
  sku?: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  oldPrice?: number | null;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  badge?: string | null;
  inStock: boolean;
  stockQuantity?: number;
  stock?: number;
  featured?: boolean;
  popular?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;

  specifications?: ProductSpecification[];
};