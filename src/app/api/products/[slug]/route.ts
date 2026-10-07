import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { INPUT_LIMITS, exceedsTextLimit } from "@/lib/input-limits";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "publicCatalogIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await context.params;
    if (exceedsTextLimit(slug, INPUT_LIMITS.product.slug)) {
      return NextResponse.json(
        { success: false, message: "Product slug is too long." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        slug,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      product: toProductView(product),
    });
  } catch (error) {
    console.error(
      "GET /api/products/[slug] failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      {
        status: 500,
      }
    );
  }
}