import { NextResponse } from "next/server";

import { requireCustomerApiWithProfileCheck } from "@/lib/customer-auth";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  try {
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { customerId: session.customer.id },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });
    const productsWithReviewSummaries = await addCustomerReviewSummaries(
      wishlistItems.map(({ product }) => product)
    );
    const productById = new Map(
      productsWithReviewSummaries.map((product) => [product.id, product])
    );

    return NextResponse.json({
      products: wishlistItems.map(({ product }) => ({
        id: product.id,
        inStock: product.inStock && product.stockQuantity > 0,
        stockQuantity: product.stockQuantity,
        product: toProductView(productById.get(product.id) ?? product),
      })),
    });
  } catch (error) {
    console.error("CUSTOMER WISHLIST GET ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load your saved wishlist." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  const productId = await readProductId(request);
  if (productId instanceof NextResponse) return productId;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json(
        { error: "This product is no longer available." },
        { status: 404 }
      );
    }

    await prisma.wishlistItem.upsert({
      where: {
        customerId_productId: {
          customerId: session.customer.id,
          productId,
        },
      },
      create: { customerId: session.customer.id, productId },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CUSTOMER WISHLIST POST ERROR:", error);
    return NextResponse.json(
      { error: "Unable to save this product to your wishlist." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  const rawId = new URL(request.url).searchParams.get("productId");
  if (
    rawId !== null &&
    (!rawId || rawId.length > INPUT_LIMITS.checkout.productId)
  ) {
    return NextResponse.json(
      { error: "Provide a valid product ID." },
      { status: 400 }
    );
  }

  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        customerId: session.customer.id,
        ...(rawId ? { productId: rawId } : {}),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CUSTOMER WISHLIST DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Unable to update your wishlist." },
      { status: 500 }
    );
  }
}

async function readProductId(request: Request): Promise<string | NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Provide a valid product ID." },
      { status: 400 }
    );
  }

  const productId =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).productId
      : undefined;
  if (
    typeof productId !== "string" ||
    productId.length === 0 ||
    productId.length > INPUT_LIMITS.checkout.productId
  ) {
    return NextResponse.json(
      { error: "Provide a valid product ID." },
      { status: 400 }
    );
  }
  return productId;
}
