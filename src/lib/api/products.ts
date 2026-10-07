import type {
  Product,
  ProductSpecification,
} from "@/types/product";

export type DatabaseProduct = Product & {
  images: string[];
  description: string | null;
  stockQuantity: number;
  featured: boolean;
  specifications: ProductSpecification[];
  createdAt: string;
  updatedAt: string;
};

type ProductsResponse = {
  success: boolean;
  products: DatabaseProduct[];
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ProductResponse = {
  success: boolean;
  product: DatabaseProduct;
};

export async function getProducts(
  params?: {
    category?: string;
    brand?: string;
    search?: string;
    featured?: boolean;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<DatabaseProduct[]> {
  const searchParams = new URLSearchParams();

  if (params?.category) {
    searchParams.set("category", params.category);
  }

  if (params?.brand) {
    searchParams.set("brand", params.brand);
  }

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.featured !== undefined) {
    searchParams.set("featured", String(params.featured));
  }

  if (params?.inStock !== undefined) {
    searchParams.set("inStock", String(params.inStock));
  }

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  const response = await fetch(
    `/api/products${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const data =
    (await response.json()) as ProductsResponse;

  if (!data.success) {
    throw new Error("Failed to fetch products");
  }

  return data.products;
}

export async function getProduct(
  slug: string
): Promise<DatabaseProduct> {
  const response = await fetch(
    `/api/products/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Product not found");
  }

  const data =
    (await response.json()) as ProductResponse;

  if (!data.success) {
    throw new Error("Product not found");
  }

  return data.product;
}