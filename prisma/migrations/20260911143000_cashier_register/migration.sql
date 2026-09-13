-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('OPENING', 'SALE', 'CHANGE', 'SANGRIA', 'SUPPLY', 'EXPENSE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CashMovementStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CashAuthorizationKind" AS ENUM ('DISCOUNT', 'PAYMENT_CANCEL', 'REFUND', 'EXPENSE', 'CLOSE_OVERRIDE');

-- CreateEnum
CREATE TYPE "CashAuthorizationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'USED');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CASH';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "cashLimitCents" INTEGER NOT NULL DEFAULT 100000;
ALTER TABLE "tenants" ADD COLUMN "maxCashierDiscountPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tenants" ADD COLUMN "cashierCanRegisterExpense" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "receivedCents" INTEGER;
ALTER TABLE "payments" ADD COLUMN "changeCents" INTEGER;
ALTER TABLE "payments" ADD COLUMN "installments" INTEGER;
ALTER TABLE "payments" ADD COLUMN "brand" TEXT;
ALTER TABLE "payments" ADD COLUMN "cardKind" TEXT;
ALTER TABLE "payments" ADD COLUMN "notes" TEXT;
ALTER TABLE "payments" ADD COLUMN "operatorId" TEXT;
ALTER TABLE "payments" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "payments" ADD COLUMN "authorizedById" TEXT;
ALTER TABLE "payments" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "payments" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "idempotencyKey" TEXT;

-- CreateTable
CREATE TABLE "cash_terminals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cash_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "openingCents" INTEGER NOT NULL,
    "openingNote" TEXT,
    "countedCents" INTEGER,
    "expectedCents" INTEGER,
    "differenceCents" INTEGER,
    "closingNote" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "status" "CashMovementStatus" NOT NULL DEFAULT 'ACTIVE',
    "amountCents" INTEGER NOT NULL,
    "method" "PaymentMethod",
    "reason" TEXT,
    "notes" TEXT,
    "operatorId" TEXT NOT NULL,
    "authorizedById" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_authorizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT,
    "kind" "CashAuthorizationKind" NOT NULL,
    "status" "CashAuthorizationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "authorizedById" TEXT,
    "reason" TEXT NOT NULL,
    "amountCents" INTEGER,
    "orderId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "cash_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_terminals_tenantId_slug_key" ON "cash_terminals"("tenantId", "slug");
CREATE INDEX "cash_terminals_tenantId_active_sortOrder_idx" ON "cash_terminals"("tenantId", "active", "sortOrder");
CREATE INDEX "cash_sessions_tenantId_status_idx" ON "cash_sessions"("tenantId", "status");
CREATE INDEX "cash_sessions_tenantId_terminalId_status_idx" ON "cash_sessions"("tenantId", "terminalId", "status");
CREATE INDEX "cash_sessions_openedById_openedAt_idx" ON "cash_sessions"("openedById", "openedAt");
CREATE UNIQUE INDEX "cash_sessions_one_open_per_terminal" ON "cash_sessions"("tenantId", "terminalId") WHERE "status" = 'OPEN';
CREATE UNIQUE INDEX "cash_movements_tenantId_idempotencyKey_key" ON "cash_movements"("tenantId", "idempotencyKey");
CREATE INDEX "cash_movements_tenantId_sessionId_createdAt_idx" ON "cash_movements"("tenantId", "sessionId", "createdAt");
CREATE INDEX "cash_movements_orderId_idx" ON "cash_movements"("orderId");
CREATE UNIQUE INDEX "payments_tenantId_idempotencyKey_key" ON "payments"("tenantId", "idempotencyKey");
CREATE INDEX "payments_sessionId_idx" ON "payments"("sessionId");
CREATE INDEX "cash_authorizations_tenantId_status_createdAt_idx" ON "cash_authorizations"("tenantId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "cash_terminals" ADD CONSTRAINT "cash_terminals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "cash_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_authorizations" ADD CONSTRAINT "cash_authorizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_authorizations" ADD CONSTRAINT "cash_authorizations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_authorizations" ADD CONSTRAINT "cash_authorizations_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_authorizations" ADD CONSTRAINT "cash_authorizations_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_authorizations" ADD CONSTRAINT "cash_authorizations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
