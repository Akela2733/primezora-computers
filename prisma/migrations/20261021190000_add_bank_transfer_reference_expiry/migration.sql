ALTER TABLE "Order"
ADD COLUMN "paymentExpiresAt" TIMESTAMP(3);

UPDATE "Order"
SET "paymentExpiresAt" = "createdAt" + INTERVAL '24 hours'
WHERE "paymentMethod" = 'bank'
  AND "paymentExpiresAt" IS NULL;
