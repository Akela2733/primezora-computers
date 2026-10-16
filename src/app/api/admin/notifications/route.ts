import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { createSiteNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HREF_LENGTH = 500;

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const notifications = await prisma.siteNotification.findMany({
      where: { sourceKey: null },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { _count: { select: { recipients: true } } },
    });
    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        href: notification.href,
        createdAt: notification.createdAt.toISOString(),
        recipientCount: notification._count.recipients,
      })),
    });
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS GET ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load notification history." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminApi();
  if (authError) return authError;

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
  const title = typeof fields.title === "string" ? fields.title.trim() : "";
  const message = typeof fields.message === "string" ? fields.message.trim() : "";
  const type = fields.type;
  const audience = fields.audience;
  const href =
    fields.href === undefined || fields.href === "" ? null : fields.href;

  if (
    title.length === 0 ||
    title.length > MAX_TITLE_LENGTH ||
    message.length === 0 ||
    message.length > MAX_MESSAGE_LENGTH ||
    (type !== "ANNOUNCEMENT" && type !== "PROMOTION") ||
    (audience !== "ALL_CUSTOMERS" &&
      audience !== "PROMOTIONAL_SUBSCRIBERS") ||
    (type === "PROMOTION" && audience !== "PROMOTIONAL_SUBSCRIBERS") ||
    (href !== null &&
      (typeof href !== "string" ||
        href.length > MAX_HREF_LENGTH ||
        !isSafeInternalHref(href)))
  ) {
    return NextResponse.json(
      { error: "Check the title, message, audience and optional link." },
      { status: 400 }
    );
  }

  try {
    const customers = await prisma.customer.findMany({
      where:
        audience === "PROMOTIONAL_SUBSCRIBERS"
          ? { promotionalEmailsEnabled: true }
          : {},
      select: { id: true },
    });
    if (customers.length === 0) {
      return NextResponse.json(
        { error: "There are no customers in this audience yet." },
        { status: 409 }
      );
    }

    const result = await createSiteNotification({
      title,
      message,
      type,
      href,
      customerIds: customers.map(({ id }) => id),
    });
    return NextResponse.json(
      { success: true, recipientCount: result.recipientCount },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN NOTIFICATIONS POST ERROR:", error);
    return NextResponse.json(
      { error: "Unable to send this notification. Please try again." },
      { status: 500 }
    );
  }
}

function isSafeInternalHref(href: string): boolean {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.startsWith("/\\") ||
    href.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(href)
  ) {
    return false;
  }

  try {
    return new URL(href, "https://primezora.invalid").origin ===
      "https://primezora.invalid";
  } catch {
    return false;
  }
}
