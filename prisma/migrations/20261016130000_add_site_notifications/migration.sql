CREATE TYPE "SiteNotificationType" AS ENUM (
    'ANNOUNCEMENT',
    'PROMOTION',
    'RESTOCK',
    'ORDER_UPDATE'
);

CREATE TABLE "SiteNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "SiteNotificationType" NOT NULL,
    "href" TEXT,
    "sourceKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SiteNotification_sourceKey_key" ON "SiteNotification"("sourceKey");
CREATE INDEX "SiteNotification_createdAt_idx" ON "SiteNotification"("createdAt");
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_customerId_key" ON "NotificationRecipient"("notificationId", "customerId");
CREATE INDEX "NotificationRecipient_customerId_readAt_idx" ON "NotificationRecipient"("customerId", "readAt");

ALTER TABLE "NotificationRecipient"
ADD CONSTRAINT "NotificationRecipient_notificationId_fkey"
FOREIGN KEY ("notificationId") REFERENCES "SiteNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationRecipient"
ADD CONSTRAINT "NotificationRecipient_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
