ALTER TABLE "Customer"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailVerificationToken" TEXT,
ADD COLUMN "emailVerificationSentAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Customer_emailVerificationToken_key"
ON "Customer"("emailVerificationToken");

CREATE INDEX "Customer_emailVerified_idx"
ON "Customer"("emailVerified");

CREATE INDEX "Customer_emailVerificationExpiresAt_idx"
ON "Customer"("emailVerificationExpiresAt");

UPDATE "Customer"
SET "emailVerified" = true;
