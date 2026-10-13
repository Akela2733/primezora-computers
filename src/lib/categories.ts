import { prisma } from "@/lib/prisma";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCategories: string[];
};

export function normalizeCategorySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const [categoryRecords, productCategories] = await Promise.all([
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        isActive: true,
      },
    }),
    prisma.product.findMany({
      distinct: ["category"],
      select: {
        category: true,
      },
      orderBy: {
        category: "asc",
      },
    }),
  ]);

  const categories: CatalogCategory[] = categoryRecords
    .filter((category) => category.isActive)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      productCategories: [],
    }));

  for (const catalogCategory of categories) {
    const categoryKeys = new Set([
      normalizeCategorySlug(catalogCategory.name),
      normalizeCategorySlug(catalogCategory.slug),
    ]);

    catalogCategory.productCategories = productCategories
      .map(({ category }) => category)
      .filter((category) => categoryKeys.has(normalizeCategorySlug(category)));
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}
