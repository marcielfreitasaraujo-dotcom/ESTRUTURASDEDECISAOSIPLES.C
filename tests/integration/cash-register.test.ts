import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ConflictError, ForbiddenError } from "@/lib/errors";
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

  it("não marca PIX como pago sem confirmação e recusa desconto acima do limite", async () => {
    await prisma.cashSession.updateMany({ where: { tenantId, status: "OPEN" }, data: { status: "CLOSED", closedAt: new Date() } });
    await openCashSession({ tenantId, userId, openingCents: 10000 });
    const order = await prisma.order.create({
      data: {
        tenantId,
        number: 800000 + Math.floor(Math.random() * 999),
        publicCode: `P${Date.now().toString().slice(-6)}`,
        status: "CONFIRMED",
        fulfillment: "PICKUP",
        customerName: "PIX Caixa",
        customerPhone: "00000000",
        subtotalCents: 5000,
        totalCents: 5000,
        paymentMethod: "PIX",
        paymentStatus: "PENDING",
        idempotencyKey: `pix-${Date.now()}`,
      },
    });
    const pendingPix = await receiveOrderPayment({
      tenantId,
      userId,
      orderId: order.id,
      tenders: [{ method: "PIX", amountCents: 5000, confirmPix: false }],
      idempotencyKey: `pix-pay-${order.id}`,
    });
    expect(pendingPix.allPaid).toBe(false);
    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.paymentStatus).toBe("PENDING");

    await expect(
      receiveOrderPayment({
        tenantId,
        userId,
        orderId: order.id,
        tenders: [{ method: "CASH", amountCents: 4500, receivedCents: 4500 }],
        discountCents: 500,
        idempotencyKey: `disc-${order.id}`,
      }),
    ).rejects.toThrow(/Desconto acima do limite permitido/);
  });

  it("recusa despesa do caixa sem permissão e isola estabelecimento", async () => {
    await expect(
      registerCashMovement({
        tenantId,
        userId,
        type: "EXPENSE",
        amountCents: 3500,
        reason: "gelo",
        idempotencyKey: `exp-${Date.now()}`,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    if (otherTenantId !== tenantId) {
      const foreign = await prisma.order.create({
        data: {
          tenantId: otherTenantId,
          number: 700000 + Math.floor(Math.random() * 999),
          publicCode: `X${Date.now().toString().slice(-6)}`,
          status: "CONFIRMED",
          fulfillment: "PICKUP",
          customerName: "Outra Loja",
          customerPhone: "00000000",
          subtotalCents: 1000,
          totalCents: 1000,
          paymentMethod: "CASH",
          paymentStatus: "PENDING",
          idempotencyKey: `iso-${Date.now()}`,
        },
      });
      await expect(
        receiveOrderPayment({
          tenantId,
          userId,
          orderId: foreign.id,
          tenders: [{ method: "CASH", amountCents: 1000, receivedCents: 1000 }],
          idempotencyKey: `iso-pay-${foreign.id}`,
        }),
      ).rejects.toThrow(/Pedido não encontrado/);
    }
  });

  it("sessão fica isolada no estabelecimento", async () => {
    if (otherTenantId === tenantId) return;
    const leaked = await prisma.cashSession.findFirst({ where: { tenantId: otherTenantId, openedById: userId, status: "OPEN" } });
    expect(leaked).toBeNull();
  });
});
