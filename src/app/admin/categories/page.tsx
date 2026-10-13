import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdminPage } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { normalizeCategorySlug } from "@/lib/categories";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPage("/admin/categories");

  const [categories, productCategoryCounts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
  ]);
  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <section className="border-b border-white/[0.06]">
        <div className="container-primezora py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-amber-600"
          >
            <ArrowLeft size={13} />
            Admin Dashboard
          </Link>
          <p className="mt-7 font-display text-[9px] uppercase tracking-[0.3em] text-amber-600">
            Store Management
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold uppercase">
            Categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Create and update storefront categories. Deactivate a category to
            remove it from the storefront without deleting its products.
          </p>
        </div>
      </section>

      <section className="container-primezora py-8">
        <CategoryManager
          initialCategories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            image: category.image ?? "",
            isActive: category.isActive,
            productCount: productCategoryCounts.reduce((count, item) => {
              const categoryKeys = new Set([
                normalizeCategorySlug(category.name),
                normalizeCategorySlug(category.slug),
              ]);
              return categoryKeys.has(normalizeCategorySlug(item.category))
                ? count + item._count._all
                : count;
            }, 0),
          }))}
        />
      </section>
    </main>
  );
}
