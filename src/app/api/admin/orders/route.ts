import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminOrdersApi } from "@/lib/admin-orders-auth";
import { isOrderStatus, type OrderStatus } from "@/lib/order-status";
import { INPUT_LIMITS } from "@/lib/input-limits";
import {
  PAGINATION_LIMITS,
  parsePagination,
} from "@/lib/pagination-limits";

const PAYMENT_METHODS = ["cod", "bank"] as const;
const DATE_FILTERS = ["today", "last7days", "last30days", "all"] as const;

function getCreatedAtFilter(filter: string) {
  const now = new Date();
  if (filter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (filter === "last7days") {
    return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (filter === "last30days") {
    return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }
  return undefined;
}

export async function GET(request: Request) {
  const authError = await requireAdminOrdersApi();
  if (authError) return authError;

  const params = new URL(request.url).searchParams;
  const pagination = parsePagination(params, {
    ...PAGINATION_LIMITS.adminOrders,
    pageSizeParam: "pageSize",
  });
  const search = (params.get("search") ?? "").trim();
  const rawStatus = params.get("status") ?? "";
  const paymentMethod = params.get("paymentMethod") ?? "";
  const dateFilter = params.get("dateRange") ?? "all";

  if (
    !pagination ||
    search.length > INPUT_LIMITS.order.adminSearch ||
    (rawStatus && !isOrderStatus(rawStatus)) ||
    (paymentMethod &&
      !PAYMENT_METHODS.includes(
        paymentMethod as (typeof PAYMENT_METHODS)[number]
      )) ||
    !DATE_FILTERS.includes(dateFilter as (typeof DATE_FILTERS)[number])
  ) {
    return NextResponse.json(
      { error: "Invalid order filters or pagination parameters." },
      { status: 400 }
    );
  }

  const createdAt = getCreatedAtFilter(dateFilter);
  const where = {
    ...(rawStatus ? { status: rawStatus as OrderStatus } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" as const } },
            { customerName: { contains: search, mode: "insensitive" as const } },
            { customerEmail: { contains: search, mode: "insensitive" as const } },
            { customerPhone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          createdAt: true,
          total: true,
          paymentMethod: true,
          deliveryMethod: true,
          status: true,
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
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages: Math.ceil(total / pagination.pageSize),
    });
  } catch (error) {
    console.error("ADMIN ORDERS API LOAD ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load orders. Please try again." },
      { status: 500 }
    );
  }
}
