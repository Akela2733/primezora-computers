import { NextResponse } from "next/server";

import { requireCustomerApiWithProfileCheck } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_ID_MAX_LENGTH = 191;

export async function GET(request: Request) {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  try {
    const customerId = session.customer.id;
    const url = new URL(request.url);
    if (url.searchParams.get("countOnly") === "1") {
      const unreadCount = await prisma.notificationRecipient.count({
        where: { customerId, readAt: null },
      });
      return NextResponse.json(
        { unreadCount },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const [recipients, unreadCount] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where: { customerId },
        orderBy: { notification: { createdAt: "desc" } },
        take: 100,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              message: true,
              type: true,
              href: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.notificationRecipient.count({
        where: { customerId, readAt: null },
      }),
    ]);

    return NextResponse.json(
      {
        notifications: recipients.map(({ id, readAt, notification }) => ({
          id,
          readAt: readAt?.toISOString() ?? null,
          notification: {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
          },
        })),
        unreadCount,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER NOTIFICATIONS GET ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load your notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Provide valid notification details." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Provide valid notification details." },
      { status: 400 }
    );
  }

  const fields = body as Record<string, unknown>;
  const markAllRead = fields.markAllRead === true;
  const notificationId = fields.notificationId;
  if (
    (!markAllRead &&
      (typeof notificationId !== "string" ||
        notificationId.length === 0 ||
        notificationId.length > NOTIFICATION_ID_MAX_LENGTH)) ||
    (markAllRead && notificationId !== undefined)
  ) {
    return NextResponse.json(
      { error: "Provide a valid notification ID or mark all as read." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.notificationRecipient.updateMany({
      where: {
        customerId: session.customer.id,
        readAt: null,
        ...(markAllRead ? {} : { id: notificationId as string }),
      },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error) {
    console.error("CUSTOMER NOTIFICATIONS PATCH ERROR:", error);
    return NextResponse.json(
      { error: "Unable to update your notifications." },
      { status: 500 }
    );
  }
}
