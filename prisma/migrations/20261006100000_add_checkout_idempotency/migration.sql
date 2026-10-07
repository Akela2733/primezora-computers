CREATE TABLE "CheckoutIdempotency" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutIdempotency_orderId_key"
ON "CheckoutIdempotency"("orderId");

CREATE UNIQUE INDEX "CheckoutIdempotency_customerId_key_key"
ON "CheckoutIdempotency"("customerId", "key");

CREATE INDEX "CheckoutIdempotency_createdAt_idx"
ON "CheckoutIdempotency"("createdAt");

ALTER TABLE "CheckoutIdempotency"
ADD CONSTRAINT "CheckoutIdempotency_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckoutIdempotency"
ADD CONSTRAINT "CheckoutIdempotency_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
