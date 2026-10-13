import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { validateCategoryInput } from "@/lib/category-validation";
import { normalizeCategorySlug } from "@/lib/categories";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    if (!id || id.length > INPUT_LIMITS.category.id) {
      return NextResponse.json(
        { error: "Invalid category identifier." },
        { status: 400 }
      );
    }
    const body: unknown = await request.json();
    const validation = validateCategoryInput(body, { partial: true });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const category = await prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: validation.data,
      });

      const nameChanged =
        validation.data.name !== undefined &&
        validation.data.name !== existing.name;
      const slugChanged =
        validation.data.slug !== undefined &&
        validation.data.slug !== existing.slug;

      if (nameChanged || slugChanged) {
        const oldKeys = new Set([
          normalizeCategorySlug(existing.name),
          normalizeCategorySlug(existing.slug),
        ]);
        const productCategories = await tx.product.findMany({
          distinct: ["category"],
          select: { category: true },
        });
        const matchingCategories = productCategories
          .map(({ category: productCategory }) => productCategory)
          .filter((productCategory) =>
            oldKeys.has(normalizeCategorySlug(productCategory))
          );

        if (matchingCategories.length > 0) {
          await tx.product.updateMany({
            where: { category: { in: matchingCategories } },
            data: { category: updated.name },
          });
        }
      }

      return updated;
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
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
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}
