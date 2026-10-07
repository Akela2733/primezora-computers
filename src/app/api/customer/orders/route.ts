import { NextResponse } from "next/server";

import { requireCustomerApi } from "@/lib/customer-auth";
import {
  PAGINATION_LIMITS,
  parsePagination,
} from "@/lib/pagination-limits";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { session, response } = await requireCustomerApi();
  if (response) return response;

  const params = new URL(request.url).searchParams;
  const pagination = parsePagination(params, {
    ...PAGINATION_LIMITS.customerOrders,
    pageSizeParam: "pageSize",
  });

  if (!pagination) {
    return NextResponse.json(
      { error: "Invalid pagination parameters." },
      { status: 400 }
    );
  }

  try {
    const where = { customerId: session!.customer.id };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          deliveryMethod: true,
          subtotal: true,
          deliveryFee: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          paymentMethod: true,
          items: { select: { quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map(({ items, ...order }) => ({
        ...order,
        itemCount: items.reduce((count, item) => count + item.quantity, 0),
      })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages: Math.ceil(total / pagination.pageSize),
    });
  } catch (error) {
    console.error("CUSTOMER ORDERS LIST ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load your orders. Please try again." },
      { status: 500 }
    );
  }
}
