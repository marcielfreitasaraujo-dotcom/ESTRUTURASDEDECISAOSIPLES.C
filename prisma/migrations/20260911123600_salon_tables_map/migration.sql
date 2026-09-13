-- CreateEnum
CREATE TYPE "SalonTableStatus" AS ENUM ('FREE', 'OCCUPIED', 'RESERVED', 'BLOCKED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "partySize" INTEGER;
ALTER TABLE "orders" ADD COLUMN "waiterId" TEXT;

-- CreateTable
CREATE TABLE "salon_sectors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salon_tables" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT,
    "status" "SalonTableStatus" NOT NULL DEFAULT 'FREE',
    "seats" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "currentOrderId" TEXT,
    "waiterId" TEXT,
    "customerName" TEXT,
    "partySize" INTEGER,
    "openedAt" TIMESTAMP(3),
    "reservedAt" TIMESTAMP(3),
    "reservationName" TEXT,
    "reservationPeople" INTEGER,
    "reservationNotes" TEXT,
    "joinedToTableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salon_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salon_sectors_tenantId_slug_key" ON "salon_sectors"("tenantId", "slug");
CREATE INDEX "salon_sectors_tenantId_sortOrder_idx" ON "salon_sectors"("tenantId", "sortOrder");
CREATE UNIQUE INDEX "salon_tables_tenantId_sectorId_number_key" ON "salon_tables"("tenantId", "sectorId", "number");
CREATE INDEX "salon_tables_tenantId_status_idx" ON "salon_tables"("tenantId", "status");
CREATE INDEX "salon_tables_tenantId_sectorId_sortOrder_idx" ON "salon_tables"("tenantId", "sectorId", "sortOrder");
CREATE INDEX "salon_tables_currentOrderId_idx" ON "salon_tables"("currentOrderId");
CREATE INDEX "orders_waiterId_idx" ON "orders"("waiterId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salon_sectors" ADD CONSTRAINT "salon_sectors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salon_tables" ADD CONSTRAINT "salon_tables_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salon_tables" ADD CONSTRAINT "salon_tables_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "salon_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salon_tables" ADD CONSTRAINT "salon_tables_currentOrderId_fkey" FOREIGN KEY ("currentOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salon_tables" ADD CONSTRAINT "salon_tables_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salon_tables" ADD CONSTRAINT "salon_tables_joinedToTableId_fkey" FOREIGN KEY ("joinedToTableId") REFERENCES "salon_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
