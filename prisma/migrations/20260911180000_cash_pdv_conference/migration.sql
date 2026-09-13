-- CreateEnum
CREATE TYPE "CashConferenceStatus" AS ENUM ('NONE', 'PENDING', 'CONFERRED', 'DIFFERENCE');

-- AlterEnum
ALTER TYPE "CashMovementType" ADD VALUE IF NOT EXISTS 'PAYMENT';
ALTER TYPE "CashMovementType" ADD VALUE IF NOT EXISTS 'CLOSING';

-- AlterTable users
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "operatorCode" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- AlterTable memberships
ALTER TABLE "tenant_memberships" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable terminals
ALTER TABLE "cash_terminals" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "cash_terminals" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- AlterTable sessions
ALTER TABLE "cash_sessions" ADD COLUMN IF NOT EXISTS "publicCode" TEXT;
ALTER TABLE "cash_sessions" ADD COLUMN IF NOT EXISTS "operatorId" TEXT;
ALTER TABLE "cash_sessions" ADD COLUMN IF NOT EXISTS "conferenceStatus" "CashConferenceStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "cash_sessions" ADD COLUMN IF NOT EXISTS "conferredById" TEXT;
ALTER TABLE "cash_sessions" ADD COLUMN IF NOT EXISTS "conferredAt" TIMESTAMP(3);
ALTER TABLE "cash_sessions" ADD COLUMN IF NOT EXISTS "conferenceNote" TEXT;

UPDATE "cash_sessions"
SET "operatorId" = "openedById"
WHERE "operatorId" IS NULL;

WITH numbered AS (
  SELECT
    s.id,
    ROW_NUMBER() OVER (PARTITION BY s."tenantId" ORDER BY s."openedAt", s."id") AS rn,
    t."sortOrder"
  FROM "cash_sessions" s
  JOIN "cash_terminals" t ON t.id = s."terminalId"
)
UPDATE "cash_sessions" cs
SET "publicCode" = numbered.rn::text || '-' || (numbered."sortOrder" + 1)::text
FROM numbered
WHERE cs.id = numbered.id
  AND (cs."publicCode" IS NULL OR cs."publicCode" = '');

ALTER TABLE "cash_sessions" ALTER COLUMN "operatorId" SET NOT NULL;
ALTER TABLE "cash_sessions" ALTER COLUMN "publicCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "cash_sessions_tenantId_publicCode_key"
  ON "cash_sessions"("tenantId", "publicCode");
CREATE INDEX IF NOT EXISTS "cash_sessions_tenantId_operatorId_status_idx"
  ON "cash_sessions"("tenantId", "operatorId", "status");
CREATE INDEX IF NOT EXISTS "cash_sessions_tenantId_conferenceStatus_idx"
  ON "cash_sessions"("tenantId", "conferenceStatus");
CREATE INDEX IF NOT EXISTS "cash_sessions_tenantId_openedAt_idx"
  ON "cash_sessions"("tenantId", "openedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "cash_sessions_one_open_per_operator"
  ON "cash_sessions"("tenantId", "operatorId")
  WHERE "status" = 'OPEN';

ALTER TABLE "cash_sessions"
  ADD CONSTRAINT "cash_sessions_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cash_sessions"
  ADD CONSTRAINT "cash_sessions_conferredById_fkey"
  FOREIGN KEY ("conferredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
