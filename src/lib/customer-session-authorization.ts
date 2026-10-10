import { NextResponse } from "next/server";

export class CustomerSessionUnavailableError extends Error {
  constructor() {
    super(
      "Customer session could not be verified because the service is unavailable."
    );
    this.name = "CustomerSessionUnavailableError";
  }
}

export async function resolveCustomerSession<T extends {
  authUserId: string | null;
  email: string;
  emailVerified: boolean;
}>(
  verified: { customerId: string; authUserId: string },
  findCustomer: (customerId: string) => Promise<T | null>
): Promise<{ customer: T; authUserId: string; email: string } | null> {
  let customer: T | null;
  try {
    customer = await findCustomer(verified.customerId);
  } catch {
    console.error("CUSTOMER_SESSION_LOOKUP_UNAVAILABLE");
    throw new CustomerSessionUnavailableError();
  }

  if (
    !customer ||
    !verified.authUserId ||
    customer.authUserId !== verified.authUserId ||
    !customer.emailVerified
  ) {
    return null;
  }

  return {
    customer,
    authUserId: customer.authUserId,
    email: customer.email,
  };
}

export async function resolveCustomerApiSession<T>(
  resolveSession: () => Promise<T | null>
): Promise<{ session: T | null; response: NextResponse | null }> {
  let session: T | null;
  try {
    session = await resolveSession();
  } catch (error) {
    if (!(error instanceof CustomerSessionUnavailableError)) throw error;
    return {
      session: null,
      response: NextResponse.json(
        { error: "Authentication service temporarily unavailable." },
        { status: 503 }
      ),
    };
  }

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: "Authentication required.",
          loginUrl: "/login",
        },
        { status: 401 }
      ),
    };
  }

  return { session, response: null };
}

export async function resolveCustomerPageSession<T>(
  resolveSession: () => Promise<T | null>,
  redirectToLogin: () => never
): Promise<T> {
  const session = await resolveSession();
  if (!session) redirectToLogin();
  return session;
}
