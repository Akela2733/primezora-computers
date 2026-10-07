import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProductInput } from "@/lib/product-validation";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  findOverLimitQueryParameter,
  INPUT_LIMITS,
} from "@/lib/input-limits";
import {
  PAGINATION_LIMITS,
  parsePagination,
} from "@/lib/pagination-limits";

export async function GET(request: Request) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const overLimitParameter = findOverLimitQueryParameter(searchParams, {
    q: INPUT_LIMITS.product.search,
  });
  if (overLimitParameter) {
    return NextResponse.json(
      { error: `Query parameter "${overLimitParameter}" is too long.` },
      { status: 400 }
    );
  }

  const pagination = parsePagination(searchParams, {
    ...PAGINATION_LIMITS.adminProducts,
    pageSizeParam: "limit",
  });
  if (!pagination) {
    return NextResponse.json(
      { error: "Invalid pagination parameters." },
      { status: 400 }
    );
  }
  const searchQuery = searchParams.get("q")?.trim() ?? "";

  try {
    const where = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" as const } },
            { slug: { contains: searchQuery, mode: "insensitive" as const } },
            { brand: { contains: searchQuery, mode: "insensitive" as const } },
            {
              category: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : undefined;
    const total = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page: pagination.page,
        limit: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (error) {
    // Use production-safe logger
    import("@/lib/logger").then(({ logger }) =>
      logger.error("GET PRODUCTS ERROR", error)
    );
    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = validateProductInput(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({
      where: {
        slug: validation.data.slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "A product with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: validation.data,
    });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid product data." },
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
        { error: "A product with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create product.",
      },
      { status: 500 }
    );
  }
}