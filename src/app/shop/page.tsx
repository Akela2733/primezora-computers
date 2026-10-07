import { prisma } from "@/lib/prisma";
import { normalizeCategorySlug } from "@/lib/categories";
import { toProductView } from "@/lib/product-view";

import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [productRecords, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        inStock: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.product.findMany({
      where: {
        inStock: true,
      },
      distinct: ["category"],
      select: {
        category: true,
      },
      orderBy: {
        category: "asc",
      },
    }),
    prisma.product.findMany({
      where: {
        inStock: true,
      },
      distinct: ["brand"],
      select: {
        brand: true,
      },
      orderBy: {
        brand: "asc",
      },
    }),
  ]);

  return (
    <ShopClient
      products={productRecords.map(toProductView)}
      categories={categories.map(({ category }) => ({
        id: category,
        name: category,
        slug: normalizeCategorySlug(category),
      }))}
      brands={brands.map((item) => item.brand)}
    />
  );
}