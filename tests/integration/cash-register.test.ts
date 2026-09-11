import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ConflictError } from "@/lib/errors";
import {
  closeCashSession,
  openCashSession,
  receiveOrderPayment,
  registerCashMovement,
} from "@/server/services/cash";
import { hasPermission } from "@/domain/rbac/roles";
import { PERMISSIONS } from "@/domain/rbac/permissions";

const prisma = new PrismaClient();

describe("turno do caixa", () => {
  let tenantId = "";
  let userId = "";
  let otherTenantId = "";

  beforeAll(async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: "central-da-pizza" } });
    const other = await prisma.tenant.findUnique({ where: { slug: "pizzaria-teste" } });
    const cashier = await prisma.user.findUnique({ where: { username: "caixa" } });
    if (!tenant || !cashier) throw new Error("Seed incompleto: rode npm run db:seed");
    tenantId = tenant.id;
    userId = cashier.id;
    otherTenantId = other?.id ?? tenant.id;
    await prisma.cashSession.updateMany({ where: { tenantId, status: "OPEN" }, data: { status: "CLOSED", closedAt: new Date() } });
  });

  afterAll(async () => {
    await prisma.cashSession.updateMany({ where: { tenantId, status: "OPEN" }, data: { status: "CLOSED", closedAt: new Date() } });
    await prisma.$disconnect();
  });

  it("abre, impede duplicidade, recebe misto, sangria e fecha", async () => {
    const opened = await openCashSession({ tenantId, userId, openingCents: 20000, note: "troco" });
    await expect(openCashSession({ tenantId, userId, openingCents: 1000 })).rejects.toBeInstanceOf(ConflictError);

    const order = await prisma.order.create({
      data: {
        tenantId,
        number: 900000 + Math.floor(Math.random() * 999),
        publicCode: `T${Date.now().toString().slice(-6)}`,
        status: "CONFIRMED",
        fulfillment: "PICKUP",
        customerName: "Teste Caixa",
        customerPhone: "00000000",
        subtotalCents: 10000,
        totalCents: 10000,
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        idempotencyKey: `cash-test-${Date.now()}`,
      },
    });

    const paid = await receiveOrderPayment({
      tenantId,
      userId,
      orderId: order.id,
      tenders: [
        { method: "CASH", amountCents: 4000, receivedCents: 4000 },
        { method: "PIX", amountCents: 6000, confirmPix: true },
      ],
      idempotencyKey: `pay-${order.id}`,
    });
    expect(paid.allPaid).toBe(true);

    const again = await receiveOrderPayment({
      tenantId,
      userId,
      orderId: order.id,
      tenders: [{ method: "CASH", amountCents: 10000, receivedCents: 10000 }],
      idempotencyKey: `pay-${order.id}`,
    });
    expect(again.duplicated).toBe(true);

    await registerCashMovement({
      tenantId,
      userId,
      type: "SANGRIA",
      amountCents: 5000,
      reason: "excess",
      idempotencyKey: `sangria-${opened.id}`,
    });

    const closed = await closeCashSession({
      tenantId,
      userId,
      countedCents: 19000,
      note: "conferido",
      confirm: true,
    });
    expect(closed.session.status).toBe("CLOSED");
    expect(closed.difference).toBe(0);
  });

  it("caixa não acessa financeiro nem estoque", () => {
    expect(hasPermission("CASHIER", PERMISSIONS.FINANCE_READ)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.INVENTORY_WRITE)).toBe(false);
    expect(hasPermission("CASHIER", PERMISSIONS.TEAM_READ)).toBe(false);
  });

  it("sessão fica isolada no estabelecimento", async () => {
    if (otherTenantId === tenantId) return;
    const leaked = await prisma.cashSession.findFirst({ where: { tenantId: otherTenantId, openedById: userId, status: "OPEN" } });
    expect(leaked).toBeNull();
  });
});
