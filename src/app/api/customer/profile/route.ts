import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerApi } from "@/lib/customer-auth";
import { CUSTOMER_PROFILE_FIELD_MAX_LENGTHS } from "@/lib/customer-profile-validation";

// ---------------------------------------------------------------------------
// Allowed editable fields — email intentionally excluded
// ---------------------------------------------------------------------------
const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "province",
  "postalCode",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

// ---------------------------------------------------------------------------
// GET /api/customer/profile
// ---------------------------------------------------------------------------
export async function GET() {
  const { session, response } = await requireCustomerApi();
  if (response) return response;

  const { customer } = session!;

  return NextResponse.json({
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      province: customer.province,
      postalCode: customer.postalCode,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/customer/profile
// ---------------------------------------------------------------------------
export async function PATCH(request: Request) {
  const { session, response } = await requireCustomerApi();
  if (response) return response;

  const { customer } = session!;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const rawBody = body as Record<string, unknown>;

  // Reject unexpected fields
  const receivedKeys = Object.keys(rawBody);
  const unknownKeys = receivedKeys.filter(
    (k) => !(EDITABLE_FIELDS as readonly string[]).includes(k)
  );
  if (unknownKeys.length > 0) {
    return NextResponse.json(
      { error: `Unexpected field(s): ${unknownKeys.join(", ")}. Only profile fields may be updated here.` },
      { status: 400 }
    );
  }

  // Build validated update data
  const updateData: Partial<Record<EditableField, string | null>> = {};

  for (const field of EDITABLE_FIELDS) {
    if (!(field in rawBody)) continue;

    const value = rawBody[field];

    if (value !== null && value !== undefined && typeof value !== "string") {
      return NextResponse.json(
        { error: `Field "${field}" must be a string or null.` },
        { status: 400 }
      );
    }

    const trimmed = typeof value === "string" ? value.trim() : null;

    if (
      (field === "firstName" || field === "lastName") &&
      (trimmed === null || trimmed === "")
    ) {
      return NextResponse.json(
        { error: `${field === "firstName" ? "First" : "Last"} name cannot be empty.` },
        { status: 400 }
      );
    }

    const maxLength = CUSTOMER_PROFILE_FIELD_MAX_LENGTHS[field];
    if (trimmed !== null && trimmed.length > maxLength) {
      return NextResponse.json(
        { error: `Field "${field}" cannot exceed ${maxLength} characters.` },
        { status: 400 }
      );
    }

    updateData[field] = trimmed === "" ? null : trimmed;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided for update." }, { status: 400 });
  }

  // Derive computed name if first/last names are being updated
  const nameUpdate: { name?: string } = {};
  const nextFirst =
    "firstName" in updateData ? updateData.firstName ?? customer.firstName : customer.firstName;
  const nextLast =
    "lastName" in updateData ? updateData.lastName ?? customer.lastName : customer.lastName;

  if ("firstName" in updateData || "lastName" in updateData) {
    const computedName = [nextFirst, nextLast].filter(Boolean).join(" ").trim();
    nameUpdate.name = computedName;
  }

  try {
    // Security: always look up by the session-verified customerId
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...updateData,
        ...nameUpdate,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        name: updated.name,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        province: updated.province,
        postalCode: updated.postalCode,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("PROFILE_UPDATE_ERROR:", error);
    return NextResponse.json(
      { error: "Unable to update profile. Please try again later." },
      { status: 500 }
    );
  }
}
