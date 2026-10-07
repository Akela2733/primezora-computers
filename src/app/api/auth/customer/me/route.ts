import { NextResponse } from "next/server";
import {
  CustomerSessionUnavailableError,
  getCustomerSession,
} from "@/lib/customer-auth";

export async function GET() {
  let session;
  try {
    session = await getCustomerSession();
  } catch (error) {
    if (!(error instanceof CustomerSessionUnavailableError)) throw error;
    return NextResponse.json(
      { error: "Authentication service temporarily unavailable." },
      { status: 503 }
    );
  }

  if (!session) {
    return NextResponse.json({ authenticated: false, customer: null }, { status: 401 });
  }

  const { customer } = session;

  return NextResponse.json({
    authenticated: true,
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
    },
  });
}
