import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "publicCatalogIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const fields =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const productIds = fields.productIds;

  if (
    !Array.isArray(productIds) ||
    productIds.length === 0 ||
    productIds.length > INPUT_LIMITS.checkout.itemLines
  ) {
    return NextResponse.json(
      { success: false, message: "Provide valid product IDs." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const validProductIds = productIds.filter(
    (id): id is string =>
      typeof id === "string" &&
      id.length > 0 &&
      id.length <= INPUT_LIMITS.checkout.productId
  );
  if (validProductIds.length !== productIds.length) {
    return NextResponse.json(
      { success: false, message: "Provide valid product IDs." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(validProductIds)] } },
    });
    const productsWithReviewSummaries =
      await addCustomerReviewSummaries(products);

    return NextResponse.json(
      {
        success: true,
        products: productsWithReviewSummaries.map((product) => ({
          id: product.id,
          inStock: product.inStock && product.stockQuantity > 0,
          stockQuantity: product.stockQuantity,
          product: toProductView(product),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/products/availability failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check product availability." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
