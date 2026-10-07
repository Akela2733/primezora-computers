import { NextResponse } from "next/server";
import { clearCustomerSessionCookie } from "@/lib/customer-auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  try {
    await clearCustomerSessionCookie();
    return NextResponse.json({
      success: true,
      redirectUrl: "/login",
    });
  } catch (error) {
    console.error("CUSTOMER_LOGOUT_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to log out." },
      { status: 500 }
    );
  }
}
