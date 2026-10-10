import { NextResponse } from "next/server";
import type { PrismaClient } from "@/generated/prisma/client";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import { issueCustomerEmailConfirmation } from "@/lib/email-confirmation";

type CustomerRegistrationSignUpResult = {
  success: boolean;
  user?: { id: string };
  error?: string;
  requiresEmailConfirmation?: boolean;
  emailMayExist?: boolean;
};

type CustomerRegistrationDependencies = {
  db: PrismaClient;
  signUp: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<CustomerRegistrationSignUpResult>;
  issueSession: (
    customerId: string,
    authUserId: string,
    email: string
  ) => Promise<void>;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createRegistrationAcceptedResponse(
  redirectPath: string,
  email?: string
): NextResponse {
  const redirectUrl = email
    ? `/email-confirmation?email=${encodeURIComponent(email)}&next=${encodeURIComponent(redirectPath)}`
    : `/login?registered=true&next=${encodeURIComponent(redirectPath)}`;

  return NextResponse.json(
    {
      success: true,
      requiresSignIn: true,
      requiresEmailConfirmation: Boolean(email),
      redirectUrl,
    },
    { status: 201 }
  );
}

export async function handleCustomerRegistration(
  request: Request,
  dependencies: CustomerRegistrationDependencies
): Promise<NextResponse> {
  const { db, signUp, issueSession } = dependencies;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Registration details are required." },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      next,
    } = body as Record<string, unknown>;

    const cleanFirstName =
      typeof firstName === "string" ? firstName.trim() : "";
    const cleanLastName = typeof lastName === "string" ? lastName.trim() : "";
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPassword = typeof password === "string" ? password : "";
    const cleanConfirmPassword =
      typeof confirmPassword === "string" ? confirmPassword : "";
    const redirectPath = getSafeCustomerRedirectPath(next);

    if (!cleanFirstName || !cleanLastName) {
      return NextResponse.json(
        { error: "First and last name are required." },
        { status: 400 }
      );
    }

    if (cleanFirstName.length > 50 || cleanLastName.length > 50) {
      return NextResponse.json(
        { error: "Name fields cannot exceed 50 characters." },
        { status: 400 }
      );
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (cleanPassword !== cleanConfirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const existingCustomer = await db.customer.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

    if (existingCustomer) {
      if (!existingCustomer.emailVerified) {
        await issueCustomerEmailConfirmation({
          id: existingCustomer.id,
          email: cleanEmail,
          firstName: existingCustomer.firstName,
          lastName: existingCustomer.lastName,
          name: existingCustomer.name,
        });
      }

      return createRegistrationAcceptedResponse(redirectPath, cleanEmail);
    }

    const signUpResult = await signUp({
      email: cleanEmail,
      password: cleanPassword,
      firstName: cleanFirstName,
      lastName: cleanLastName,
    });

    if (signUpResult.emailMayExist || signUpResult.error?.toLowerCase().includes("already")) {
      return createRegistrationAcceptedResponse(redirectPath, cleanEmail);
    }

    if (!signUpResult.success || !signUpResult.user) {
      return NextResponse.json(
        { error: signUpResult.error || "Registration could not be completed." },
        { status: 400 }
      );
    }

    const authUserId = signUpResult.user.id;
    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const customer = await db.customer.create({
      data: {
        authUserId,
        email: cleanEmail,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        name: fullName,
      },
    });

    if (signUpResult.requiresEmailConfirmation) {
      const emailConfirmation = await issueCustomerEmailConfirmation({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        name: customer.name,
      });

      if (!emailConfirmation.success) {
        return NextResponse.json(
          {
            error:
              emailConfirmation.error ||
              "We could not send your confirmation email. Please contact support.",
          },
          { status: 500 }
        );
      }

      return createRegistrationAcceptedResponse(redirectPath, customer.email);
    }

    await issueSession(customer.id, authUserId, customer.email);

    return NextResponse.json(
      {
        success: true,
        requiresEmailConfirmation: false,
        redirectUrl: redirectPath,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CUSTOMER_REGISTER_ERROR:", error);
    return NextResponse.json(
      { error: "Unable to process registration. Please try again later." },
      { status: 500 }
    );
  }
}
