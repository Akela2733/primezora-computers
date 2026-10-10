import type { PrismaClient } from "@/generated/prisma/client";
import {
  getPrismaVerificationIssuer,
  getPrismaVerificationRepository,
  issueCustomerEmailConfirmation as issueConfirmation,
  verifyCustomerEmailConfirmation as verifyConfirmation,
  type CustomerEmailVerificationIssuer,
  type CustomerEmailVerificationRepository,
} from "@/lib/email-confirmation-core";
import type { EmailProvider } from "@/lib/notifications/types";

export {
  buildEmailConfirmationUrl,
  CUSTOMER_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  CUSTOMER_EMAIL_VERIFICATION_TTL_MS,
} from "@/lib/email-confirmation-core";
export type {
  CustomerEmailVerificationIssuer,
  CustomerEmailVerificationRepository,
  CustomerEmailVerificationStatus,
  VerificationTokenRecord,
} from "@/lib/email-confirmation-core";

type ConfirmationCustomer = Parameters<typeof issueConfirmation>[0];

export async function issueCustomerEmailConfirmation(
  params: ConfirmationCustomer,
  dependencies: {
    db?: PrismaClient;
    provider?: EmailProvider;
    now?: Date;
    repository?: CustomerEmailVerificationIssuer;
  } = {}
) {
  let repository = dependencies.repository;
  if (!repository) {
    const db = dependencies.db ?? (await import("@/lib/prisma")).prisma;
    repository = getPrismaVerificationIssuer(db);
  }
  return issueConfirmation(params, {
    repository,
    provider: dependencies.provider,
    now: dependencies.now,
  });
}

export async function verifyCustomerEmailConfirmation(
  rawToken: string,
  repository?: CustomerEmailVerificationRepository,
  now = new Date()
) {
  let activeRepository = repository;
  if (!activeRepository) {
    const { prisma } = await import("@/lib/prisma");
    activeRepository = getPrismaVerificationRepository(prisma);
  }
  return verifyConfirmation(
    rawToken,
    activeRepository,
    now
  );
}
