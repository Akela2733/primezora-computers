import type { PrismaClient } from "@/generated/prisma/client";

export class CustomerIdentityLinkError extends Error {
  constructor() {
    super("Unable to link this account. Please contact support.");
    this.name = "CustomerIdentityLinkError";
  }
}

type ResolveCustomerIdentityInput = {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function resolveCustomerIdentity(
  db: PrismaClient,
  input: ResolveCustomerIdentityInput
) {
  const customerByAuthUserId = await db.customer.findUnique({
    where: { authUserId: input.authUserId },
  });
  if (customerByAuthUserId) return customerByAuthUserId;

  const customerByEmail = await db.customer.findUnique({
    where: { email: input.email },
  });

  if (customerByEmail) {
    if (customerByEmail.authUserId !== null) {
      throw new CustomerIdentityLinkError();
    }

    const linked = await db.customer.updateMany({
      where: {
        id: customerByEmail.id,
        authUserId: null,
      },
      data: { authUserId: input.authUserId },
    });

    if (linked.count === 1) {
      return db.customer.findUniqueOrThrow({
        where: { id: customerByEmail.id },
      });
    }

    const currentCustomer = await db.customer.findUnique({
      where: { id: customerByEmail.id },
    });
    if (currentCustomer?.authUserId === input.authUserId) {
      return currentCustomer;
    }

    throw new CustomerIdentityLinkError();
  }

  const fullName =
    `${input.firstName} ${input.lastName}`.trim() ||
    input.email.split("@")[0];

  return db.customer.create({
    data: {
      authUserId: input.authUserId,
      email: input.email,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      name: fullName,
    },
  });
}
