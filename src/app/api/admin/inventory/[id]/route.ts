import { NextResponse } from "next/server";

import { MAX_STOCK_QUANTITY } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid inventory data." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const { stockQuantity, expectedUpdatedAt, expectedStockQuantity } = input;

    if (
      typeof stockQuantity !== "number" ||
      !Number.isSafeInteger(stockQuantity) ||
      stockQuantity < 0 ||
      stockQuantity > MAX_STOCK_QUANTITY
    ) {
      return NextResponse.json(
        { error: "Stock quantity must be a non-negative integer." },
        { status: 400 }
      );
    }

    if (
      typeof expectedStockQuantity !== "number" ||
      !Number.isSafeInteger(expectedStockQuantity) ||
      expectedStockQuantity < 0 ||
      expectedStockQuantity > MAX_STOCK_QUANTITY
    ) {
      return NextResponse.json(
        { error: "Current stock is required to safely update inventory." },
        { status: 400 }
      );
    }

    if (typeof expectedUpdatedAt !== "string") {
      return NextResponse.json(
        { error: "Inventory version is required." },
        { status: 400 }
      );
    }

    const expectedVersion = new Date(expectedUpdatedAt);
    if (Number.isNaN(expectedVersion.getTime())) {
      return NextResponse.json(
        { error: "Invalid inventory version." },
        { status: 400 }
      );
    }

    const update = await prisma.product.updateMany({
      where: {
        id,
        updatedAt: expectedVersion,
        stockQuantity: expectedStockQuantity,
      },
      data: {
        stockQuantity,
        inStock: stockQuantity > 0,
      },
    });

    if (update.count !== 1) {
      const current = await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          stockQuantity: true,
          inStock: true,
          updatedAt: true,
        },
      });

      if (!current) {
        return NextResponse.json(
          { error: "Product not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: "Inventory changed elsewhere. Refresh and try again.",
          current: {
            ...current,
            updatedAt: current.updatedAt.toISOString(),
          },
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        stockQuantity: true,
        inStock: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("UPDATE INVENTORY ERROR:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid inventory data." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update inventory." },
      { status: 500 }
    );
  }
}