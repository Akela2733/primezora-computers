import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProductInput } from "@/lib/product-validation";
import { requireAdminApi } from "@/lib/admin-auth";
import { INPUT_LIMITS, exceedsTextLimit } from "@/lib/input-limits";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function invalidProductId(id: string): NextResponse | null {
  return exceedsTextLimit(id, INPUT_LIMITS.product.id)
    ? NextResponse.json(
        { error: "Product ID is too long." },
        { status: 400 }
      )
    : null;
}

export async function GET(
  _request: Request,
  { params }: Params
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const invalidIdResponse = invalidProductId(id);
    if (invalidIdResponse) return invalidIdResponse;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load product.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: Params
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const invalidIdResponse = invalidProductId(id);
    if (invalidIdResponse) return invalidIdResponse;
    const body = await request.json();

    const existing = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const validation = validateProductInput(
      body,
      existing
    );
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const slugExists = await prisma.product.findFirst({
      where: {
        slug: validation.data.slug,
        id: {
          not: id,
        },
      },
      select: {
        id: true,
      },
    });

    if (slugExists) {
      return NextResponse.json(
        { error: "A product with this slug already exists." },
        { status: 409 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

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
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
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
        error: "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: Params
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const invalidIdResponse = invalidProductId(id);
    if (invalidIdResponse) return invalidIdResponse;
    const body = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      (body.inStock !== undefined &&
        typeof body.inStock !== "boolean")
    ) {
      return NextResponse.json(
        { error: "Availability must be a boolean value." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const requestedInStock =
      typeof body.inStock === "boolean"
        ? body.inStock
        : !product.inStock;

    if (requestedInStock && product.stockQuantity <= 0) {
      return NextResponse.json(
        { error: "Add stock before enabling this product." },
        { status: 409 }
      );
    }

    const updatedProduct =
      await prisma.product.update({
        where: { id },
        data: {
          inStock: requestedInStock,
        },
      });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/products/[id] error:",
      error
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid product status data." },
        { status: 400 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: Params
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const invalidIdResponse = invalidProductId(id);
    if (invalidIdResponse) return invalidIdResponse;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    if (product._count.orderItems > 0) {
      return NextResponse.json(
        {
          error:
            "This product has existing orders and cannot be permanently deleted. Disable it instead.",
          canDisable: true,
        },
        { status: 409 }
      );
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product permanently deleted.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/products/[id] error:",
      error
    );

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "This product has existing orders and cannot be permanently deleted. Disable it instead.",
          canDisable: true,
        },
        { status: 409 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}