import { prisma } from "@/lib/prisma";
import { getCatalogCategories } from "@/lib/categories";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { getStorefrontContent } from "@/lib/storefront-content";

import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [productRecords, categories, brands, content] = await Promise.all([
    prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
    getCatalogCategories(),
    prisma.product.findMany({
      distinct: ["brand"],
      select: {
        brand: true,
      },
      orderBy: {
        brand: "asc",
      },
    }),
    getStorefrontContent(),
  ]);

  if (!content) {
    throw new Error("Storefront content is missing from the database.");
  }

  return (
    <ShopClient
      products={(await addCustomerReviewSummaries(productRecords)).map(toProductView)}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }))}
      brands={brands.map((item) => item.brand)}
      content={content.shop}
    />
  );
}