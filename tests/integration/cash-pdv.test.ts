import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import {
  closeCashSession,
  openCashSession,
  receiveOrderPayment,
  registerCashMovement,
  requestRefund,
  sessionTotals,
} from "@/server/services/cash";
import {
  adjustCashSession,
  conferCashSession,
  getCashSessionDetail,
  listCashDeskSessions,
} from "@/server/services/cash-desk";
import { assertCanViewCashSession } from "@/server/services/cash-access";
import { expectedCashCents } from "@/domain/cash/math";
import { authorizeManager } from "@/server/services/cash";

const prisma = new PrismaClient();

describe("PDV de caixa: operadores, conferência e histórico", () => {
  let tenantId = "";
  let mariaId = "";
  let joaoId = "";
  let gerenteId = "";
  let adminId = "";
  let terminalA = "";
  let terminalB = "";

  beforeAll(async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: "central-da-pizza" } });
    const gerente = await prisma.user.findUnique({ where: { username: "gerente" } });
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    if (!tenant || !gerente) throw new Error("Seed incompleto: rode npm run db:seed");
    tenantId = tenant.id;
    gerenteId = gerente.id;
    adminId = admin?.id ?? gerente.id;

    const stamp = Date.now().toString().slice(-6);
    const maria = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: "Maria PDV",
        displayName: "Maria",
        operatorCode: `M${stamp}`,
        email: `maria.pdv.${stamp}@comandaia.test`,
        username: `maria-pdv-${stamp}`,
        emailVerified: true,
      },
    });
    const joao = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: "João PDV",
        displayName: "João",
        operatorCode: `J${stamp}`,
        email: `joao.pdv.${stamp}@comandaia.test`,
        username: `joao-pdv-${stamp}`,
        emailVerified: true,
      },
    });
    mariaId = maria.id;
    joaoId = joao.id;
    await prisma.tenantMembership.createMany({
      data: [
        { tenantId, userId: mariaId, role: "CASHIER" },
        { tenantId, userId: joaoId, role: "CASHIER" },
      ],
    });
    const tA = await prisma.cashTerminal.create({
      data: { tenantId, name: `PDV A ${stamp}`, slug: `pdv-a-${stamp}`, code: "PDVA", sortOrder: 80 },
    });
    const tB = await prisma.cashTerminal.create({
      data: { tenantId, name: `PDV B ${stamp}`, slug: `pdv-b-${stamp}`, code: "PDVB", sortOrder: 81 },
    });
    terminalA = tA.id;
    terminalB = tB.id;
  });

  afterAll(async () => {
    await prisma.cashSession.updateMany({
      where: { tenantId, operatorId: { in: [mariaId, joaoId] }, status: "OPEN" },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await prisma.$disconnect();
  });

  async function paidOrder(operatorId: string, amountCents: number, tenders: Parameters<typeof receiveOrderPayment>[0]["tenders"]) {
    const order = await prisma.order.create({
      data: {
        tenantId,
        number: 600000 + Math.floor(Math.random() * 99999),
        publicCode: `C${Date.now().toString().slice(-7)}`,
        trackingToken: crypto.randomUUID(),
        status: "CONFIRMED",
        fulfillment: "PICKUP",
        customerName: "Cliente PDV",
        customerPhone: "11999999999",
        subtotalCents: amountCents,
        totalCents: amountCents,
        paymentMethod: tenders[0].method,
        paymentStatus: "PENDING",
        idempotencyKey: `pdv-${crypto.randomUUID()}`,
      },
    });
    await receiveOrderPayment({
      tenantId,
      userId: operatorId,
      orderId: order.id,
      tenders,
      idempotencyKey: `pay-${order.id}`,
    });
    return order;
  }

  it("abre com R$ 500, calcula físico, fecha exato/falta/sobra e conferência", async () => {
    const opened = await openCashSession({
      tenantId,
      userId: mariaId,
      operatorId: mariaId,
      terminalId: terminalA,
      openingCents: 50000,
    });
    expect(opened.status).toBe("OPEN");
    expect(opened.openingCents).toBe(50000);
    expect(opened.publicCode).toMatch(/^\d+-\d+$/);

    await expect(
      openCashSession({ tenantId, userId: joaoId, operatorId: joaoId, terminalId: terminalA, openingCents: 1000 }),
    ).rejects.toBeInstanceOf(ConflictError);

    await expect(
      openCashSession({ tenantId, userId: mariaId, operatorId: mariaId, terminalId: terminalB, openingCents: 1000 }),
    ).rejects.toBeInstanceOf(ConflictError);

    await paidOrder(mariaId, 10000, [{ method: "CASH", amountCents: 10000, receivedCents: 10000 }]);
    let totals = await sessionTotals(opened.id, tenantId);
    expect(totals.expectedCashCents).toBe(60000);

    await paidOrder(mariaId, 10000, [{ method: "PIX", amountCents: 10000, confirmPix: true }]);
    totals = await sessionTotals(opened.id, tenantId);
    expect(totals.expectedCashCents).toBe(60000);
    expect(totals.pixCents).toBe(10000);

    await registerCashMovement({
      tenantId,
      userId: mariaId,
      type: "SANGRIA",
      amountCents: 20000,
      reason: "deposit",
      idempotencyKey: `sangria-${opened.id}`,
    });
    totals = await sessionTotals(opened.id, tenantId);
    expect(totals.expectedCashCents).toBe(40000);

    await registerCashMovement({
      tenantId,
      userId: mariaId,
      type: "SUPPLY",
      amountCents: 10000,
      reason: "change",
      idempotencyKey: `supply-${opened.id}`,
    });
    totals = await sessionTotals(opened.id, tenantId);
    expect(totals.expectedCashCents).toBe(50000);

    const closed = await closeCashSession({
      tenantId,
      userId: mariaId,
      countedCents: 50000,
      confirm: true,
    });
    expect(closed.difference).toBe(0);
    expect(closed.session.conferenceStatus).toBe("PENDING");

    await conferCashSession({
      tenantId,
      userId: gerenteId,
      sessionId: closed.session.id,
      note: "Caixa exato",
    });
    const conferred = await prisma.cashSession.findUniqueOrThrow({ where: { id: closed.session.id } });
    expect(conferred.conferenceStatus).toBe("CONFERRED");
  });

  it("fecha com falta e com sobra e mantém a diferença no histórico", async () => {
    const opened = await openCashSession({
      tenantId,
      userId: mariaId,
      terminalId: terminalA,
      openingCents: 50000,
    });
    await paidOrder(mariaId, 100000, [{ method: "CASH", amountCents: 100000, receivedCents: 100000 }]);
    await paidOrder(mariaId, 50000, [{ method: "PIX", amountCents: 50000, confirmPix: true }]);
    await paidOrder(mariaId, 30000, [{ method: "CARD", amountCents: 30000, cardKind: "CREDIT" }]);
    await registerCashMovement({
      tenantId,
      userId: mariaId,
      type: "SUPPLY",
      amountCents: 10000,
      reason: "change",
      idempotencyKey: `sup-${opened.id}`,
    });
    await registerCashMovement({
      tenantId,
      userId: mariaId,
      type: "SANGRIA",
      amountCents: 40000,
      reason: "deposit",
      idempotencyKey: `sg-${opened.id}`,
    });
    const previousExpense = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { cashierCanRegisterExpense: true },
    });
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { cashierCanRegisterExpense: true },
    });
    await registerCashMovement({
      tenantId,
      userId: mariaId,
      type: "EXPENSE",
      amountCents: 5000,
      reason: "emergency",
      idempotencyKey: `exp-${opened.id}`,
    });
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { cashierCanRegisterExpense: previousExpense.cashierCanRegisterExpense },
    });
    const totals = await sessionTotals(opened.id, tenantId);
    expect(totals.expectedCashCents).toBe(115000);

    const shortage = await closeCashSession({
      tenantId,
      userId: mariaId,
      countedCents: 114000,
      confirm: true,
    });
    expect(shortage.difference).toBe(-1000);
    expect(shortage.session.differenceCents).toBe(-1000);

    const historic = await listCashDeskSessions(tenantId, { query: shortage.session.publicCode, period: "all" });
    expect(historic.some((row) => row.id === shortage.session.id && row.differenceCents === -1000)).toBe(true);

    const over = await openCashSession({
      tenantId,
      userId: joaoId,
      terminalId: terminalB,
      openingCents: 50000,
    });
    const overClose = await closeCashSession({
      tenantId,
      userId: joaoId,
      countedCents: 51000,
      confirm: true,
    });
    expect(overClose.difference).toBe(1000);
    expect(over.operatorId).toBe(joaoId);
  });

  it("consulta caixas antigos, admin vê qualquer operador e caixa não vê o turno alheio", async () => {
    const old = await prisma.cashSession.create({
      data: {
        tenantId,
        terminalId: terminalB,
        publicCode: `OLD-${Date.now().toString().slice(-5)}`,
        operatorId: mariaId,
        openedById: mariaId,
        status: "CLOSED",
        openingCents: 20000,
        countedCents: 20000,
        expectedCents: 20000,
        differenceCents: 0,
        conferenceStatus: "CONFERRED",
        openedAt: new Date("2025-12-15T14:00:00.000Z"),
        closedAt: new Date("2025-12-15T22:00:00.000Z"),
      },
    });
    const yesterday = await prisma.cashSession.create({
      data: {
        tenantId,
        terminalId: terminalB,
        publicCode: `YDA-${Date.now().toString().slice(-5)}`,
        operatorId: mariaId,
        openedById: mariaId,
        status: "CLOSED",
        openingCents: 10000,
        countedCents: 10000,
        expectedCents: 10000,
        differenceCents: 0,
        conferenceStatus: "PENDING",
        openedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
      },
    });

    const monthAgo = await listCashDeskSessions(tenantId, {
      from: "2025-12-01",
      to: "2025-12-31",
      period: "custom",
      operatorId: mariaId,
    });
    expect(monthAgo.some((row) => row.id === old.id)).toBe(true);

    const yday = await listCashDeskSessions(tenantId, { period: "all", operatorId: mariaId });
    expect(yday.some((row) => row.id === yesterday.id)).toBe(true);

    const adminView = await getCashSessionDetail({
      tenantId,
      userId: adminId,
      role: "OWNER",
      sessionId: old.id,
    });
    expect(adminView.session.operatorId).toBe(mariaId);

    await expect(
      assertCanViewCashSession({
        tenantId,
        userId: joaoId,
        role: "CASHIER",
        session: { operatorId: mariaId, openedById: mariaId },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("estorno não apaga a venda original e ajuste gera auditoria", async () => {
    await prisma.cashSession.updateMany({
      where: { tenantId, operatorId: mariaId, status: "OPEN" },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    const opened = await openCashSession({
      tenantId,
      userId: mariaId,
      terminalId: terminalA,
      openingCents: 10000,
    });
    const order = await paidOrder(mariaId, 8000, [{ method: "CASH", amountCents: 8000, receivedCents: 8000 }]);
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id, status: "PAID" } });
    const auth = await authorizeManager({
      tenantId,
      requestedById: mariaId,
      login: "gerente",
      password: "Gerente!2026",
      kind: "REFUND",
      reason: "Cliente desistiu da venda",
      orderId: order.id,
    });
    await requestRefund({
      tenantId,
      userId: mariaId,
      paymentId: payment.id,
      reason: "Cliente desistiu da venda",
      authorizationId: auth.id,
    });
    const movements = await prisma.cashMovement.findMany({
      where: { sessionId: opened.id, orderId: order.id },
    });
    expect(movements.some((row) => row.type === "SALE" && row.status === "ACTIVE")).toBe(true);
    expect(movements.some((row) => row.type === "REFUND" && row.status === "ACTIVE")).toBe(true);

    await adjustCashSession({
      tenantId,
      userId: gerenteId,
      sessionId: opened.id,
      amountCents: 500,
      reason: "Correção autorizada de sangria",
    });
    const audit = await prisma.auditLog.findFirst({
      where: { tenantId, entity: "CashMovement", metadata: { path: ["action"], equals: "ADJUSTMENT" } },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();
    await closeCashSession({ tenantId, userId: mariaId, countedCents: 2500, confirm: true });
  });
});

describe("fórmula do saldo físico", () => {
  it("ignora PIX e cartão", () => {
    expect(
      expectedCashCents({
        openingCents: 50000,
        cashSalesCents: 100000,
        supplyCents: 10000,
        sangriaCents: 40000,
        expenseCents: 5000,
      }),
    ).toBe(115000);
  });
});
