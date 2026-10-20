import { prisma } from "@/lib/prisma";
import { getCatalogCategories, normalizeCategorySlug } from "@/lib/categories";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { getStorefrontContent } from "@/lib/storefront-content";

import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [productRecords, categories, brands, content] = await Promise.all([
    prisma.product.findMany({
      where: {
        NOT: {
          slug: { startsWith: "test-only-" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    getCatalogCategories(),
    prisma.product.findMany({
      where: {
        NOT: {
          slug: { startsWith: "test-only-" },
        },
      },
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
        image: category.image,
        productCategories: category.productCategories,
        productCount: productRecords.filter((product) =>
          category.productCategories.includes(
            normalizeCategorySlug(product.category)
          )
        ).length,
      }))}
      brands={brands.map((item) => item.brand)}
      content={content.shop}
      hero={content.home.hero}
      categoryContent={content.home.categories}
    />
  );
}