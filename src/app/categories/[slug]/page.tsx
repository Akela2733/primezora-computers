import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getCatalogCategories,
  normalizeCategorySlug,
} from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { getStorefrontContent } from "@/lib/storefront-content";
import { ProductCard } from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = normalizeCategorySlug(slug);
  const [categories, content] = await Promise.all([
    getCatalogCategories(),
    getStorefrontContent(),
  ]);
  const category = categories.find(
    (item) => normalizeCategorySlug(item.slug) === normalizedSlug
  );

  if (!category || !content) {
    notFound();
  }
  const copy = content.categoryPage;

  const productRecords = await prisma.product.findMany({
    where: {
      category: {
        in: category.productCategories,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const categoryProducts = (
    await addCustomerReviewSummaries(productRecords)
  ).map(toProductView);

  return (
    <main className="min-h-screen bg-[#030505] px-4 py-12 text-white/90 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-600/80">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white/90">
              {category.name}
            </h1>
          </div>

          <Link
            href="/shop"
            className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600 transition hover:text-amber-600"
          >
            {copy.backLinkLabel}
          </Link>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-white/8 bg-[#030505] px-6 py-14 text-center">
            <h2 className="font-display text-lg font-bold uppercase tracking-[0.12em] text-white/80">
              {copy.emptyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              {copy.emptyDescription}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
