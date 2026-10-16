ALTER TABLE "Order"
ADD COLUMN "paymentTransactionId" TEXT;

CREATE UNIQUE INDEX "Order_paymentTransactionId_key"
ON "Order"("paymentTransactionId");
