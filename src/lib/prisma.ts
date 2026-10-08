import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getPrismaConnectionString } from "./prisma-connection";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaPg | undefined;
};

const useTestDatabase =
  process.env.PRIMEZORA_DATABASE_TARGET !== "production";
const connectionString = getPrismaConnectionString(process.env);

if (!connectionString) {
  throw new Error(
    useTestDatabase
      ? "DIRECT_DATABASE_URL_TEST or DATABASE_URL_TEST is required for the test runtime."
      : "DATABASE_URL or DIRECT_DATABASE_URL is required for the production runtime.",
  );
}

if (connectionString.startsWith("prisma+postgres://")) {
  throw new Error(
    "PrismaPg requires a direct PostgreSQL URL for the selected runtime database.",
  );
}

const adapter =
  globalForPrisma.adapter ??
  new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}