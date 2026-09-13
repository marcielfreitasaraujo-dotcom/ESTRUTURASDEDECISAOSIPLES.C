-- AlterTable tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingMinMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingMaxMinutes" INTEGER NOT NULL DEFAULT 45;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingHistoryDays" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingNotifyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingWhatsappEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingWhatsappNumber" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingAllowPickup" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trackingAllowDelivery" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingToken" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 40;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "estimatedMinMinutes" INTEGER;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "estimatedMaxMinutes" INTEGER;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "etaUpdatedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "outForDeliveryAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "rejected" BOOLEAN NOT NULL DEFAULT false;

UPDATE "orders"
SET "trackingToken" = replace(gen_random_uuid()::text, '-', '') || substr(id, 1, 8)
WHERE "trackingToken" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "trackingToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_trackingToken_key" ON "orders"("trackingToken");

UPDATE "orders" o
SET
  "estimatedMinutes" = COALESCE(t."estimatedMinutes", 40),
  "estimatedMinMinutes" = t."trackingMinMinutes",
  "estimatedMaxMinutes" = t."trackingMaxMinutes"
FROM "tenants" t
WHERE t.id = o."tenantId";

CREATE TABLE IF NOT EXISTS "order_eta_changes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "previousMinutes" INTEGER NOT NULL,
    "nextMinutes" INTEGER NOT NULL,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_eta_changes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_eta_changes_tenantId_orderId_createdAt_idx" ON "order_eta_changes"("tenantId", "orderId", "createdAt");

ALTER TABLE "order_eta_changes" DROP CONSTRAINT IF EXISTS "order_eta_changes_tenantId_fkey";
ALTER TABLE "order_eta_changes" ADD CONSTRAINT "order_eta_changes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_eta_changes" DROP CONSTRAINT IF EXISTS "order_eta_changes_orderId_fkey";
ALTER TABLE "order_eta_changes" ADD CONSTRAINT "order_eta_changes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "whatsapp_dispatches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT,
    "event" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_dispatches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "whatsapp_dispatches_tenantId_createdAt_idx" ON "whatsapp_dispatches"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "whatsapp_dispatches_orderId_idx" ON "whatsapp_dispatches"("orderId");

ALTER TABLE "whatsapp_dispatches" DROP CONSTRAINT IF EXISTS "whatsapp_dispatches_tenantId_fkey";
ALTER TABLE "whatsapp_dispatches" ADD CONSTRAINT "whatsapp_dispatches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_dispatches" DROP CONSTRAINT IF EXISTS "whatsapp_dispatches_orderId_fkey";
ALTER TABLE "whatsapp_dispatches" ADD CONSTRAINT "whatsapp_dispatches_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "feature_flags" ("id", "key", "scope", "scopeId", "enabled")
SELECT 'ff_order_tracking_platform', 'order_tracking', 'platform', 'platform', true
WHERE NOT EXISTS (
  SELECT 1 FROM "feature_flags" WHERE "key" = 'order_tracking' AND "scope" = 'platform'
);
