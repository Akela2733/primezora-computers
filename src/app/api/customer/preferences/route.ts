import { NextResponse } from "next/server";

import { requireCustomerApiWithProfileCheck } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

const preferenceFields = [
  "restockAlertsEnabled",
  "orderUpdateEmailsEnabled",
  "promotionalEmailsEnabled",
] as const;

type PreferenceField = (typeof preferenceFields)[number];

function isPreferenceField(value: string): value is PreferenceField {
  return preferenceFields.some((field) => field === value);
}

export async function GET() {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  try {
    const { customer } = session;
    return NextResponse.json({
      preferences: {
        restockAlertsEnabled: customer.restockAlertsEnabled,
        orderUpdateEmailsEnabled: customer.orderUpdateEmailsEnabled,
        promotionalEmailsEnabled: customer.promotionalEmailsEnabled,
      },
    });
  } catch (error) {
    console.error("CUSTOMER PREFERENCES GET ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load your website preferences." },
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
      { error: "Provide valid preference settings." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Provide valid preference settings." },
      { status: 400 }
    );
  }

  const fields = body as Record<string, unknown>;
  const entries = Object.entries(fields);
  if (
    entries.length === 0 ||
    entries.some(
      ([key, value]) => !isPreferenceField(key) || typeof value !== "boolean"
    )
  ) {
    return NextResponse.json(
      { error: "Provide valid preference settings." },
      { status: 400 }
    );
  }

  try {
    const preferences = Object.fromEntries(entries) as Partial<
      Record<PreferenceField, boolean>
    >;
    const customer = await prisma.customer.update({
      where: { id: session.customer.id },
      data: preferences,
      select: {
        restockAlertsEnabled: true,
        orderUpdateEmailsEnabled: true,
        promotionalEmailsEnabled: true,
      },
    });

    return NextResponse.json({ preferences: customer });
  } catch (error) {
    console.error("CUSTOMER PREFERENCES PATCH ERROR:", error);
    return NextResponse.json(
      { error: "Unable to save your website preferences." },
      { status: 500 }
    );
  }
}
