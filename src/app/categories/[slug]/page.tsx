import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getCategoryBySlug,
  getSupportedCategories,
  isSupportedCategory,
} from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { ProductCard } from "@/components/shop/ProductCard";

export async function generateStaticParams() {
  return getSupportedCategories().map(({ slug }) => ({ slug }));
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category || !isSupportedCategory(category)) {
    notFound();
  }

  const productRecords = await prisma.product.findMany({
    where: {
      category: category.productCategory,
      inStock: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const categoryProducts = productRecords.map(toProductView);

  return (
    <main className="min-h-screen bg-[#05090f] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400/80">
              Shop by category
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {category.displayName}
            </h1>
          </div>

          <Link
            href="/shop"
            className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-400 transition hover:text-orange-300"
          >
            Back to all products
          </Link>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-white/8 bg-[#080d13] px-6 py-14 text-center">
            <h2 className="font-display text-lg font-bold uppercase tracking-[0.12em] text-white/80">
              No products in this category yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              Browse the shop to see all currently available products.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
