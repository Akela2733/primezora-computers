import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import {
  findOverLimitQueryParameter,
  INPUT_LIMITS,
} from "@/lib/input-limits";
import {
  PAGINATION_LIMITS,
  parsePagination,
} from "@/lib/pagination-limits";

export async function GET(request: NextRequest) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "publicCatalogIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const overLimitParameter = findOverLimitQueryParameter(searchParams, {
      search: INPUT_LIMITS.catalog.search,
      category: INPUT_LIMITS.catalog.category,
      brand: INPUT_LIMITS.catalog.brand,
      featured: INPUT_LIMITS.catalog.featured,
      inStock: INPUT_LIMITS.catalog.inStock,
    });

    if (overLimitParameter) {
      return NextResponse.json(
        {
          success: false,
          message: `Query parameter "${overLimitParameter}" is too long.`,
        },
        { status: 400 }
      );
    }

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const brand = searchParams.get("brand")?.trim() || "";
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("inStock");

    const pagination = parsePagination(searchParams, {
      ...PAGINATION_LIMITS.catalog,
      pageSizeParam: "limit",
    });
    if (!pagination) {
      return NextResponse.json(
        { success: false, message: "Invalid pagination parameters." },
        { status: 400 }
      );
    }

    const where = {
      ...(inStock === undefined ? { inStock: true } : { inStock: inStock === "true" }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { brand: { contains: search, mode: "insensitive" as const } },
              { category: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(category
        ? { category: { equals: category, mode: "insensitive" as const } }
        : {}),
      ...(brand
        ? { brand: { equals: brand, mode: "insensitive" as const } }
        : {}),
      ...(featured === "true"
        ? { featured: true }
        : featured === "false"
          ? { featured: false }
          : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      products: products.map(toProductView),
      count: products.length,
      pagination: {
        page: pagination.page,
        limit: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (error) {
    console.error(
      "GET /api/products error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load products",
      },
      {
        status: 500,
      }
    );
  }
}