CREATE TYPE "PaymentStatus" AS ENUM (
    'PAYMENT_PENDING',
    'PAYMENT_VERIFICATION_PENDING',
    'PAYMENT_REJECTED',
    'PAID',
    'CANCELLED'
);

CREATE TYPE "PaymentReceiptStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

ALTER TABLE "Order"
ADD COLUMN "paymentStatus" "PaymentStatus",
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paymentVerifiedBy" TEXT,
ADD COLUMN "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'LKR';

UPDATE "Order"
SET "paymentStatus" = CASE
    WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"PaymentStatus"
    ELSE 'PAYMENT_PENDING'::"PaymentStatus"
END
WHERE "paymentMethod" = 'bank';

UPDATE "Order"
SET "paymentReference" = "orderNumber"
WHERE "paymentMethod" = 'bank';

CREATE UNIQUE INDEX "Order_paymentReference_key"
ON "Order"("paymentReference");

CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "status" "PaymentReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentReceipt_storagePath_key"
ON "PaymentReceipt"("storagePath");

CREATE INDEX "PaymentReceipt_orderId_submittedAt_idx"
ON "PaymentReceipt"("orderId", "submittedAt");

ALTER TABLE "PaymentReceipt"
ADD CONSTRAINT "PaymentReceipt_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PaymentAuditEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "receiptId" TEXT,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "transactionId" TEXT,
    "transactionReference" TEXT,
    "transactionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentAuditEvent_orderId_createdAt_idx"
ON "PaymentAuditEvent"("orderId", "createdAt");

ALTER TABLE "PaymentAuditEvent"
ADD CONSTRAINT "PaymentAuditEvent_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "PaymentAuditEvent_receiptId_fkey"
FOREIGN KEY ("receiptId") REFERENCES "PaymentReceipt"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
