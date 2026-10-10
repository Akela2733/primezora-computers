DROP INDEX "Customer_emailVerificationToken_key";

ALTER TABLE "Customer"
DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerificationExpiresAt";

CREATE TABLE "CustomerEmailVerificationToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerEmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerEmailVerificationToken_tokenHash_key"
ON "CustomerEmailVerificationToken"("tokenHash");

CREATE INDEX "CustomerEmailVerificationToken_customerId_createdAt_idx"
ON "CustomerEmailVerificationToken"("customerId", "createdAt");

CREATE INDEX "CustomerEmailVerificationToken_expiresAt_idx"
ON "CustomerEmailVerificationToken"("expiresAt");

ALTER TABLE "CustomerEmailVerificationToken"
ADD CONSTRAINT "CustomerEmailVerificationToken_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
