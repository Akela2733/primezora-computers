import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  PAGINATION_LIMITS,
  parsePagination,
} from "@/lib/pagination-limits";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const pagination = parsePagination(request.nextUrl.searchParams, {
      ...PAGINATION_LIMITS.adminCustomerOrders,
      pageSizeParam: null,
    });
    if (!pagination) {
      return NextResponse.json(
        { error: "Invalid pagination parameters." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        province: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const [totalOrders, spending, orders] = await Promise.all([
      prisma.order.count({
        where: { customerId: id },
      }),
      prisma.order.aggregate({
        where: {
          customerId: id,
          status: {
            not: "CANCELLED",
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.findMany({
        where: { customerId: id },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          total: true,
          status: true,
          paymentMethod: true,
          deliveryMethod: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    return NextResponse.json({
      customer: {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
      },
      summary: {
        totalOrders,
        totalSpending: spending._sum.total ?? 0,
      },
      orders: orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: totalOrders,
        totalPages: Math.max(
          1,
          Math.ceil(totalOrders / pagination.pageSize)
        ),
      },
    });
  } catch (error) {
    console.error("ADMIN CUSTOMER DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load customer details." },
      { status: 500 }
    );
  }
}