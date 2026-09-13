-- AlterEnum
ALTER TYPE "TenantRole" ADD VALUE 'WAITER';
ALTER TYPE "FulfillmentType" ADD VALUE 'DINE_IN';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "tableNumber" TEXT;

-- CreateIndex
CREATE INDEX "orders_tenantId_tableNumber_idx" ON "orders"("tenantId", "tableNumber");
