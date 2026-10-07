import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  PAGINATION_LIMITS,
  parsePagination,
} from "@/lib/pagination-limits";
import {
  findOverLimitQueryParameter,
  INPUT_LIMITS,
} from "@/lib/input-limits";

export async function GET(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const overLimitParameter = findOverLimitQueryParameter(searchParams, {
      q: INPUT_LIMITS.customer.search,
    });
    if (overLimitParameter) {
      return NextResponse.json(
        { error: `Query parameter "${overLimitParameter}" is too long.` },
        { status: 400 }
      );
    }

    const search = searchParams.get("q")?.trim() ?? "";
    const pagination = parsePagination(searchParams, {
      ...PAGINATION_LIMITS.adminCustomers,
      pageSizeParam: null,
    });
    if (!pagination) {
      return NextResponse.json(
        { error: "Invalid pagination parameters." },
        { status: 400 }
      );
    }

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    const customerIds = customers.map((customer) => customer.id);
    const spending = customerIds.length
      ? await prisma.order.groupBy({
          by: ["customerId"],
          where: {
            customerId: {
              in: customerIds,
            },
            status: {
              not: "CANCELLED",
            },
          },
          _sum: {
            total: true,
          },
        })
      : [];

    const spendingByCustomer = new Map(
      spending.map((group) => [
        group.customerId,
        group._sum.total ?? 0,
      ])
    );

    return NextResponse.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        orderCount: customer._count.orders,
        totalSpending: spendingByCustomer.get(customer.id) ?? 0,
        createdAt: customer.createdAt.toISOString(),
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.max(
          1,
          Math.ceil(total / pagination.pageSize)
        ),
      },
    });
  } catch (error) {
    console.error("ADMIN CUSTOMERS LIST ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load customers." },
      { status: 500 }
    );
  }
}