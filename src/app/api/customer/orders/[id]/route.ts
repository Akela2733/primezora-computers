import { NextResponse } from "next/server";

import { requireCustomerApi } from "@/lib/customer-auth";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { session, response } = await requireCustomerApi();
  if (response) return response;

  const { id } = await params;
  if (!id.trim() || id.length > INPUT_LIMITS.order.id) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id,
        customerId: session!.customer.id,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        deliveryMethod: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        paymentMethod: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        items: {
          select: {
            id: true,
            productName: true,
            productPrice: true,
            quantity: true,
            product: {
              select: { image: true },
            },
          },
        },
        statusHistory: {
          select: {
            fromStatus: true,
            toStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        ...order,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          productImage: item.product.image,
          productPrice: item.productPrice,
          quantity: item.quantity,
          lineTotal: item.productPrice * item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error("CUSTOMER ORDER DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load this order. Please try again." },
      { status: 500 }
    );
  }
}
