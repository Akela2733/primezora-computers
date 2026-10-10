import { NextResponse } from "next/server";
import type { PrismaClient } from "@/generated/prisma/client";
import { getSafeCustomerRedirectPath } from "@/lib/customer-redirect";
import { issueCustomerEmailConfirmation } from "@/lib/email-confirmation";

type CustomerRegistrationSignUpResult = {
  success: boolean;
  user?: { id: string };
  error?: string;
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
  sendVerification?: (customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    nextPath: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    retryAfterSeconds?: number;
  }>;
};

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getVerificationUrl(email: string, redirectPath: string): string {
  return `/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(redirectPath)}`;
}

function registrationError(
  status: number,
  error: string,
  options: {
    verificationPending?: boolean;
    redirectUrl?: string;
    retryAfterSeconds?: number;
  } = {}
): NextResponse {
  const { retryAfterSeconds, ...body } = options;
  return NextResponse.json(
    { error, ...body },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : {}),
      },
    }
  );
}

export async function handleCustomerRegistration(
  request: Request,
  dependencies: CustomerRegistrationDependencies
): Promise<NextResponse> {
  const sendVerification =
    dependencies.sendVerification ?? issueCustomerEmailConfirmation;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return registrationError(400, "Invalid JSON request body.");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return registrationError(400, "Registration details are required.");
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
      return registrationError(400, "First and last name are required.");
    }
    if (cleanFirstName.length > 50 || cleanLastName.length > 50) {
      return registrationError(400, "Name fields cannot exceed 50 characters.");
    }
    if (!isValidEmail(cleanEmail)) {
      return registrationError(400, "Please provide a valid email address.");
    }
    if (cleanPassword.length < 8 || cleanPassword.length > 128) {
      return registrationError(
        400,
        "Password must be between 8 and 128 characters long."
      );
    }
    if (cleanPassword !== cleanConfirmPassword) {
      return registrationError(400, "Passwords do not match.");
    }

    const existingCustomer = await dependencies.db.customer.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

    if (existingCustomer) {
      if (existingCustomer.emailVerified) {
        return registrationError(
          409,
          "An account with this email already exists. Sign in or use account recovery."
        );
      }

      const result = await sendVerification({
        ...existingCustomer,
        nextPath: redirectPath,
      });
      const redirectUrl = getVerificationUrl(cleanEmail, redirectPath);
      if (!result.success) {
        return registrationError(
          result.retryAfterSeconds ? 429 : 503,
          "We couldn't send your verification email. You can retry from the verification page.",
          {
            verificationPending: true,
            redirectUrl: `${redirectUrl}&state=send-failed${
              result.retryAfterSeconds
                ? `&cooldown=${result.retryAfterSeconds}`
                : ""
            }`,
            retryAfterSeconds: result.retryAfterSeconds,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          emailAccepted: true,
          redirectUrl,
          requiresSignIn: true,
          requiresEmailConfirmation: true,
        },
        { status: 201, headers: { "Cache-Control": "no-store" } }
      );
    }

    const signUpResult = await dependencies.signUp({
      email: cleanEmail,
      password: cleanPassword,
      firstName: cleanFirstName,
      lastName: cleanLastName,
    });

    if (!signUpResult.success || !signUpResult.user) {
      if (signUpResult.emailMayExist) {
        return registrationError(
          409,
          "An account with this email already exists. Sign in or use account recovery."
        );
      }
      return registrationError(
        400,
        signUpResult.error || "Registration could not be completed."
      );
    }

    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const customer = await dependencies.db.customer.create({
      data: {
        authUserId: signUpResult.user.id,
        email: cleanEmail,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        name: fullName,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });
    const redirectUrl = getVerificationUrl(cleanEmail, redirectPath);
    const emailResult = await sendVerification({
      ...customer,
      nextPath: redirectPath,
    });

    if (!emailResult.success) {
      return registrationError(
        emailResult.retryAfterSeconds ? 429 : 503,
        "Your account is created but we couldn't send the verification email. Please retry from the verification page.",
        {
          verificationPending: true,
          redirectUrl: `${redirectUrl}&state=send-failed${
            emailResult.retryAfterSeconds
              ? `&cooldown=${emailResult.retryAfterSeconds}`
              : ""
          }`,
          retryAfterSeconds: emailResult.retryAfterSeconds,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailAccepted: true,
        redirectUrl,
        requiresSignIn: true,
        requiresEmailConfirmation: true,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CUSTOMER_REGISTER_ERROR:", error);
    return registrationError(
      500,
      "Unable to process registration. Please try again later."
    );
  }
}
