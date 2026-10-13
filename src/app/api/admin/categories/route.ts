import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { validateCategoryInput } from "@/lib/category-validation";
import { normalizeCategorySlug } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const [categories, productCategoryCounts] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.product.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      categories: categories.map((category) => ({
        ...category,
        productCount: productCategoryCounts.reduce((count, item) => {
          const categoryKeys = new Set([
            normalizeCategorySlug(category.name),
            normalizeCategorySlug(category.slug),
          ]);
          return categoryKeys.has(normalizeCategorySlug(item.category))
            ? count + item._count._all
            : count;
        }, 0),
      })),
    });
  } catch (error) {
    console.error("GET ADMIN CATEGORIES ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body: unknown = await request.json();
    const validation = validateCategoryInput(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const category = await prisma.category.create({ data: validation.data });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid category data." },
        { status: 400 }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A category with this slug already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}
