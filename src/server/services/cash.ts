import { verifyPassword } from "better-auth/crypto";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { assertTenantId } from "@/server/tenancy";
import { freeTablesForOrder } from "@/server/services/floor";
import { evaluateCoupon } from "@/domain/coupons/evaluate";
import {
  changeCents,
  differenceCents,
  differenceLabel,
  discountWithinLimit,
  expectedCashCents,
  type CashTenderInput,
} from "@/domain/cash/math";
import { getPrintProvider } from "@/server/providers/print";
import { actorManagesCash, assertCanOperateOpenSession } from "@/server/services/cash-access";
import { operatorLabel } from "@/domain/cash/status";

const DEFAULT_TERMINALS = [
  { name: "Caixa 01", slug: "caixa-01", code: "CX01", sortOrder: 0 },
  { name: "Caixa 02", slug: "caixa-02", code: "CX02", sortOrder: 1 },
  { name: "Caixa 03", slug: "caixa-03", code: "CX03", sortOrder: 2 },
];

export async function ensureDefaultTerminals(tenantId: string) {
  const existing = await prisma.cashTerminal.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  if (existing.length === 0) {
    await prisma.cashTerminal.createMany({
      data: DEFAULT_TERMINALS.map((row) => ({ ...row, tenantId })),
    });
    return prisma.cashTerminal.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } });
  }
  const missing = DEFAULT_TERMINALS.filter((row) => !existing.some((item) => item.slug === row.slug));
  if (missing.length) {
    await prisma.cashTerminal.createMany({
      data: missing.map((row) => ({ ...row, tenantId })),
    });
  }
  return prisma.cashTerminal.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } });
}

export async function ensureDefaultTerminal(tenantId: string) {
  const terminals = await ensureDefaultTerminals(tenantId);
  return terminals.find((row) => row.active) ?? terminals[0];
}

export type OpenSessionLookup = { terminalId?: string; operatorId?: string };

export async function getOpenSession(tenantId: string, terminalIdOrLookup?: string | OpenSessionLookup) {
  const lookup: OpenSessionLookup =
    typeof terminalIdOrLookup === "string" ? { terminalId: terminalIdOrLookup } : (terminalIdOrLookup ?? {});
  return prisma.cashSession.findFirst({
    where: {
      tenantId,
      status: "OPEN",
      ...(lookup.terminalId ? { terminalId: lookup.terminalId } : {}),
      ...(lookup.operatorId ? { operatorId: lookup.operatorId } : {}),
    },
    include: {
      terminal: true,
      openedBy: { select: { id: true, name: true, displayName: true } },
      operator: { select: { id: true, name: true, displayName: true, operatorCode: true } },
    },
    orderBy: { openedAt: "desc" },
  });
}

export async function requireOpenSession(tenantId: string, userId?: string) {
  const session = userId
    ? (await getOpenSession(tenantId, { operatorId: userId })) ??
      (await prisma.cashSession.findFirst({
        where: { tenantId, status: "OPEN", openedById: userId },
        include: {
          terminal: true,
          openedBy: { select: { id: true, name: true, displayName: true } },
          operator: { select: { id: true, name: true, displayName: true, operatorCode: true } },
        },
      }))
    : await getOpenSession(tenantId);
  if (!session) {
    throw new ConflictError("Abra seu caixa para começar.");
  }
  return session;
}

async function nextPublicCode(
  tx: Prisma.TransactionClient,
  tenantId: string,
  terminalSortOrder: number,
) {
  const count = await tx.cashSession.count({ where: { tenantId } });
  let seq = count + 1;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const publicCode = `${seq}-${terminalSortOrder + 1}`;
    const taken = await tx.cashSession.findFirst({ where: { tenantId, publicCode }, select: { id: true } });
    if (!taken) return publicCode;
    seq += 1;
  }
  return `${Date.now().toString().slice(-6)}-${terminalSortOrder + 1}`;
}

export async function openCashSession(input: {
  tenantId: string;
  userId: string;
  openingCents: number;
  note?: string;
  terminalId?: string;
  operatorId?: string;
}) {
  if (!Number.isInteger(input.openingCents) || input.openingCents < 0) {
    throw new AppError("INVALID_OPENING", "Informe um valor inicial válido.");
  }
  const manages = await actorManagesCash(input.tenantId, input.userId);
  const operatorId = input.operatorId || input.userId;
  if (!manages && operatorId !== input.userId) {
    throw new ForbiddenError("Você só pode abrir o caixa no seu operador.");
  }
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId: input.tenantId, userId: operatorId },
  });
  if (membership && membership.active === false) {
    throw new ForbiddenError("Este operador está inativo.");
  }

  const terminals = await ensureDefaultTerminals(input.tenantId);
  const terminal = input.terminalId
    ? terminals.find((row) => row.id === input.terminalId)
    : terminals.find((row) => row.active) ?? terminals[0];
  if (!terminal || !terminal.active) {
    throw new NotFoundError("Terminal não encontrado.");
  }

  const terminalOpen = await getOpenSession(input.tenantId, { terminalId: terminal.id });
  if (terminalOpen) {
    throw new ConflictError("Este terminal já possui um caixa aberto.");
  }
  const operatorOpen = await getOpenSession(input.tenantId, { operatorId });
  if (operatorOpen) {
    throw new ConflictError("Este operador já possui um caixa aberto.");
  }

  const session = await prisma.$transaction(async (tx) => {
    const publicCode = await nextPublicCode(tx, input.tenantId, terminal.sortOrder);
    const created = await tx.cashSession.create({
      data: {
        tenantId: input.tenantId,
        terminalId: terminal.id,
        publicCode,
        operatorId,
        openedById: input.userId,
        openingCents: input.openingCents,
        openingNote: input.note?.trim() || null,
        conferenceStatus: "NONE",
      },
    });
    await tx.cashMovement.create({
      data: {
        tenantId: input.tenantId,
        sessionId: created.id,
        type: "OPENING",
        amountCents: input.openingCents,
        method: "CASH",
        operatorId,
        notes: input.note?.trim() || null,
        idempotencyKey: `open-${created.id}`,
      },
    });
    return created;
  });

  await writeAudit({
    action: "CREATE",
    entity: "CashSession",
    entityId: session.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: {
      openingCents: input.openingCents,
      terminalId: terminal.id,
      operatorId,
      publicCode: session.publicCode,
    },
  });
  await notifyCash(input.tenantId, "Caixa aberto", `Turno ${session.publicCode} iniciado com saldo inicial.`);
  return session;
}

export async function getCashierDashboard(tenantId: string, userId?: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      name: true,
      tradeName: true,
      cashLimitCents: true,
      maxCashierDiscountPercent: true,
      cashierCanRegisterExpense: true,
    },
  });
  const terminals = await ensureDefaultTerminals(tenantId);
  const terminal = terminals.find((row) => row.active) ?? terminals[0];
  const session = userId
    ? ((await getOpenSession(tenantId, { operatorId: userId })) ??
      (await prisma.cashSession.findFirst({
        where: { tenantId, status: "OPEN", openedById: userId },
        include: {
          terminal: true,
          openedBy: { select: { id: true, name: true, displayName: true } },
          operator: { select: { id: true, name: true, displayName: true, operatorCode: true } },
        },
      })))
    : await getOpenSession(tenantId, terminal.id);
  const lastClosed = session
    ? null
    : await prisma.cashSession.findFirst({
        where: {
          tenantId,
          status: "CLOSED",
          ...(userId ? { OR: [{ operatorId: userId }, { openedById: userId }] } : {}),
        },
        include: {
          openedBy: { select: { name: true, displayName: true } },
          operator: { select: { name: true, displayName: true } },
          terminal: true,
        },
        orderBy: { closedAt: "desc" },
      });
  const lastClosedSales = lastClosed
    ? await prisma.payment.aggregate({
        where: { tenantId, sessionId: lastClosed.id, status: "PAID" },
        _sum: { amountCents: true },
      })
    : null;

  const pending = await listPendingPayments(tenantId);
  const totals = session ? await sessionTotals(session.id, tenantId) : emptyTotals();
  const movements = session
    ? await prisma.cashMovement.findMany({
        where: { tenantId, sessionId: session.id, status: "ACTIVE" },
        include: { operator: { select: { name: true, displayName: true } }, order: { select: { publicCode: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];
  const notifications = await prisma.notification.findMany({
    where: { tenantId, type: { in: ["PAYMENT", "CASH", "NEW_ORDER"] } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const operators = await listCashOperators(tenantId);
  const cashOverLimit = Boolean(session && totals.expectedCashCents > tenant.cashLimitCents);

  return {
    tenant: {
      name: tenant.tradeName || tenant.name,
      cashLimitCents: tenant.cashLimitCents,
      maxCashierDiscountPercent: tenant.maxCashierDiscountPercent,
      cashierCanRegisterExpense: tenant.cashierCanRegisterExpense,
    },
    terminal: { id: terminal.id, name: terminal.name, code: terminal.code },
    terminals: terminals.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      active: row.active,
    })),
    operators,
    session,
    lastClosed: lastClosed
      ? { ...lastClosed, salesCents: lastClosedSales?._sum.amountCents ?? 0 }
      : null,
    pending,
    totals,
    movements,
    notifications,
    cashOverLimit,
  };
}

export async function listCashOperators(tenantId: string) {
  const members = await prisma.tenantMembership.findMany({
    where: { tenantId, role: { in: ["CASHIER", "OWNER", "MANAGER"] } },
    include: { user: { select: { id: true, name: true, displayName: true, operatorCode: true, username: true, bannedAt: true } } },
    orderBy: { createdAt: "asc" },
  });
  return members
    .filter((row) => row.active && !row.user.bannedAt)
    .map((row) => ({
      id: row.user.id,
      name: operatorLabel(row.user),
      operatorCode: row.user.operatorCode,
      username: row.user.username,
      role: row.role,
    }));
}

function emptyTotals() {
  return {
    openingCents: 0,
    salesCents: 0,
    receivedCents: 0,
    pendingCents: 0,
    sangriaCents: 0,
    supplyCents: 0,
    expenseCents: 0,
    cashSalesCents: 0,
    pixCents: 0,
    debitCents: 0,
    creditCents: 0,
    otherCents: 0,
    expectedCashCents: 0,
    movementCount: 0,
    paidCount: 0,
    debitCount: 0,
    creditCount: 0,
    pixCount: 0,
    cashCount: 0,
    otherCount: 0,
    adjustmentCents: 0,
    refundCashCents: 0,
  };
}

export async function sessionTotals(sessionId: string, tenantId: string) {
  const session = await prisma.cashSession.findFirst({ where: { id: sessionId, tenantId } });
  if (!session) return emptyTotals();
  const movements = await prisma.cashMovement.findMany({
    where: { sessionId, tenantId, status: "ACTIVE" },
  });
  const payments = await prisma.payment.findMany({
    where: { sessionId, tenantId, status: "PAID" },
  });
  const pendingOrders = await prisma.order.findMany({
    where: { tenantId, status: { not: "CANCELLED" }, paymentStatus: { not: "PAID" } },
    select: { totalCents: true },
  });

  const sumType = (type: (typeof movements)[number]["type"]) =>
    movements.filter((row) => row.type === type).reduce((sum, row) => sum + row.amountCents, 0);
  const byMethod = (method: PaymentMethod, cardKind?: string) =>
    payments
      .filter((row) => row.method === method && (cardKind ? row.cardKind === cardKind : true))
      .reduce((sum, row) => sum + row.amountCents, 0);

  const cashSalesCents = byMethod("CASH");
  const sangriaCents = sumType("SANGRIA");
  const supplyCents = sumType("SUPPLY");
  const expenseCents = sumType("EXPENSE");
  const refundCashCents = movements
    .filter((row) => row.type === "REFUND" && (row.method === "CASH" || !row.method))
    .reduce((sum, row) => sum + row.amountCents, 0);
  const adjustmentCents = movements
    .filter((row) => row.type === "ADJUSTMENT")
    .reduce((sum, row) => sum + row.amountCents, 0);
  const debitPayments = payments.filter((row) => row.method === "CARD" && row.cardKind !== "CREDIT");
  const creditPayments = payments.filter((row) => row.method === "CARD" && row.cardKind === "CREDIT");
  const pixPayments = payments.filter((row) => row.method === "PIX");
  const cashPayments = payments.filter((row) => row.method === "CASH");
  const otherPayments = payments.filter((row) => row.method === "OTHER" || row.method === "ONLINE");

  return {
    openingCents: session.openingCents,
    salesCents: payments.reduce((sum, row) => sum + row.amountCents, 0),
    receivedCents: payments.reduce((sum, row) => sum + row.amountCents, 0),
    pendingCents: pendingOrders.reduce((sum, row) => sum + row.totalCents, 0),
    sangriaCents,
    supplyCents,
    expenseCents,
    cashSalesCents,
    pixCents: byMethod("PIX"),
    debitCents: debitPayments.reduce((sum, row) => sum + row.amountCents, 0),
    creditCents: byMethod("CARD", "CREDIT"),
    otherCents: byMethod("OTHER") + byMethod("ONLINE"),
    expectedCashCents: expectedCashCents({
      openingCents: session.openingCents,
      cashSalesCents,
      supplyCents,
      sangriaCents,
      expenseCents,
      refundCashCents,
      adjustmentCents,
    }),
    movementCount: movements.length,
    paidCount: new Set(payments.map((row) => row.orderId)).size,
    debitCount: debitPayments.length,
    creditCount: creditPayments.length,
    pixCount: pixPayments.length,
    cashCount: cashPayments.length,
    otherCount: otherPayments.length,
    adjustmentCents,
    refundCashCents,
  };
}

export async function listPendingPayments(tenantId: string) {
  return prisma.order.findMany({
    where: {
      tenantId,
      status: { not: "CANCELLED" },
      paymentStatus: { notIn: ["PAID", "REFUNDED"] },
      totalCents: { gt: 0 },
    },
    include: { items: true, payments: true },
    orderBy: { createdAt: "asc" },
    take: 80,
  });
}

export async function getReceivableOrder(tenantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { items: true, payments: true, customer: true },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertTenantId(order.tenantId, tenantId);
  const methods = await prisma.tenantPaymentMethod.findMany({
    where: { tenantId, enabled: true },
    orderBy: { method: "asc" },
  });
  return { order, methods };
}

export async function searchCashier(tenantId: string, query: string, options?: { includeSessions?: boolean }) {
  const q = query.trim();
  if (q.length < 1) return { orders: [], customers: [], tables: [], operators: [], sessions: [] };
  const [orders, customers, tables, operators, sessions] = await Promise.all([
    prisma.order.findMany({
      where: {
        tenantId,
        OR: [
          { publicCode: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
          { tableNumber: { contains: q, mode: "insensitive" } },
          { customerPhone: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        publicCode: true,
        customerName: true,
        tableNumber: true,
        totalCents: true,
        paymentStatus: true,
        status: true,
      },
    }),
    prisma.customer.findMany({
      where: { tenantId, OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] },
      take: 6,
      select: { id: true, name: true, phone: true },
    }),
    prisma.salonTable.findMany({
      where: { tenantId, OR: [{ number: { contains: q } }, { customerName: { contains: q, mode: "insensitive" } }] },
      take: 6,
      select: { id: true, number: true, status: true, customerName: true },
    }),
    options?.includeSessions
      ? prisma.user.findMany({
          where: {
            memberships: { some: { tenantId } },
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { operatorCode: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 6,
          select: { id: true, name: true, displayName: true, operatorCode: true },
        })
      : Promise.resolve([]),
    options?.includeSessions
      ? prisma.cashSession.findMany({
          where: {
            tenantId,
            OR: [
              { publicCode: { contains: q, mode: "insensitive" } },
              { terminal: { name: { contains: q, mode: "insensitive" } } },
              { operator: { name: { contains: q, mode: "insensitive" } } },
            ],
          },
          include: { terminal: true, operator: { select: { name: true, displayName: true } } },
          orderBy: { openedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);
  return { orders, customers, tables, operators, sessions };
}

export async function receiveOrderPayment(input: {
  tenantId: string;
  userId: string;
  orderId: string;
  tenders: CashTenderInput[];
  discountCents?: number;
  couponCode?: string;
  partySize?: number;
  authorizationId?: string;
  idempotencyKey: string;
}) {
  const session = await requireOpenSession(input.tenantId, input.userId);
  await assertCanOperateOpenSession({ tenantId: input.tenantId, userId: input.userId, session });
  const existing = await prisma.payment.findFirst({
    where: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    const order = await prisma.order.findFirst({ where: { id: existing.orderId, tenantId: input.tenantId } });
    return { order, duplicated: true as const };
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, tenantId: input.tenantId, status: { not: "CANCELLED" } },
    include: { items: true, payments: true },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertTenantId(order.tenantId, input.tenantId);
  const alreadyPaid = order.payments
    .filter((row) => row.status === "PAID")
    .reduce((sum, row) => sum + row.amountCents, 0);
  if (order.paymentStatus === "PAID" || alreadyPaid >= order.totalCents) {
    throw new ConflictError("Este pedido já está pago.");
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: input.tenantId },
    select: { maxCashierDiscountPercent: true },
  });

  let discountCents = Math.max(0, input.discountCents ?? 0);
  if (alreadyPaid > 0) {
    discountCents = order.discountCents;
  }
  if (input.couponCode?.trim()) {
    const coupon = await prisma.coupon.findFirst({
      where: { tenantId: input.tenantId, code: input.couponCode.trim().toUpperCase() },
    });
    if (!coupon) throw new AppError("COUPON_INVALID", "Este cupom não está disponível.");
    const result = evaluateCoupon(coupon, {
      now: new Date(),
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      isFirstOrder: false,
    });
    if (!result.ok) throw new AppError("COUPON_INVALID", result.reason === "Este cupom expirou." ? "Este cupom não está disponível." : result.reason);
    discountCents = Math.max(discountCents, result.discountCents);
  }

  if (discountCents > 0 && !discountWithinLimit(order.subtotalCents, discountCents, tenant.maxCashierDiscountPercent)) {
    if (!input.authorizationId) {
      throw new AppError("DISCOUNT_LIMIT", "Desconto acima do limite permitido.");
    }
    await consumeAuthorization({
      tenantId: input.tenantId,
      authorizationId: input.authorizationId,
      kind: "DISCOUNT",
      orderId: order.id,
    });
  }

  const dueCents = Math.max(0, order.subtotalCents + order.deliveryFeeCents - discountCents - alreadyPaid);
  if (dueCents <= 0) throw new ConflictError("Este pedido já está pago.");
  const allocated = input.tenders.reduce((sum, tender) => sum + tender.amountCents, 0);
  if (allocated <= 0) {
    throw new AppError("EMPTY_TENDER", "Informe ao menos uma forma de pagamento.");
  }
  if (allocated > dueCents) {
    throw new AppError("TENDER_OVERFLOW", "O valor informado é maior que o restante do pedido.");
  }

  const created = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        discountCents,
        totalCents: dueCents,
        couponCode: input.couponCode?.trim().toUpperCase() || order.couponCode,
        partySize: input.partySize ?? order.partySize,
      },
    });

    const payments = [];
    for (const [index, tender] of input.tenders.entries()) {
      const pixConfirmed = tender.method !== "PIX" || Boolean(tender.confirmPix);
      const status = pixConfirmed ? "PAID" : "PENDING";
      let receivedCents: number | undefined;
      let change: number | undefined;
      if (tender.method === "CASH") {
        receivedCents = tender.receivedCents ?? tender.amountCents;
        change = changeCents(tender.amountCents, receivedCents);
      }
      const payment = await tx.payment.create({
        data: {
          tenantId: input.tenantId,
          orderId: order.id,
          method: tender.method,
          amountCents: tender.amountCents,
          receivedCents,
          changeCents: change,
          cardKind: tender.cardKind ?? null,
          installments: tender.method === "CARD" && tender.cardKind === "CREDIT" ? tender.installments ?? 1 : null,
          brand: tender.brand?.trim() || null,
          notes: tender.notes?.trim() || null,
          status,
          confirmedAt: status === "PAID" ? new Date() : null,
          operatorId: input.userId,
          sessionId: session.id,
          idempotencyKey: index === 0 ? input.idempotencyKey : `${input.idempotencyKey}:${index}`,
        },
      });
      payments.push(payment);
      if (status === "PAID") {
        await tx.cashMovement.create({
          data: {
            tenantId: input.tenantId,
            sessionId: session.id,
            type: "SALE",
            amountCents: tender.amountCents,
            method: tender.method,
            operatorId: session.operatorId,
            orderId: order.id,
            paymentId: payment.id,
            notes: tender.method === "CASH" && change ? `Troco ${change}` : tender.notes?.trim() || null,
            idempotencyKey: `sale-${payment.id}`,
          },
        });
      }
    }

    const newPaid = payments.filter((row) => row.status === "PAID").reduce((sum, row) => sum + row.amountCents, 0);
    const covered = alreadyPaid + newPaid;
    const totalDue = order.subtotalCents + order.deliveryFeeCents - discountCents;
    const allPaid = covered >= totalDue && payments.every((row) => row.status === "PAID");
    const dominant = dominantMethod(input.tenders);
    if (allPaid) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: dominant,
          status: order.status === "PENDING" ? "CONFIRMED" : order.status,
        },
      });
    } else {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentMethod: dominant, paymentStatus: "PENDING" },
      });
    }
    return { payments, allPaid };
  });

  if (created.allPaid && order.fulfillment === "DINE_IN") {
    await freeTablesForOrder(input.tenantId, order.id);
  }

  await writeAudit({
    action: "UPDATE",
    entity: "Payment",
    entityId: order.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { tenders: input.tenders.map((row) => ({ method: row.method, amountCents: row.amountCents })), sessionId: session.id },
  });
  await notifyCash(input.tenantId, created.allPaid ? "Pagamento aprovado" : "Pagamento pendente", `Pedido #${order.publicCode}.`);
  printSafe({ type: "RECEIPT", tenantId: input.tenantId, payload: { orderId: order.id } });
  return { orderId: order.id, allPaid: created.allPaid, duplicated: false as const };
}

export async function confirmPixPayment(input: { tenantId: string; userId: string; paymentId: string }) {
  const session = await requireOpenSession(input.tenantId, input.userId);
  await assertCanOperateOpenSession({ tenantId: input.tenantId, userId: input.userId, session });
  const payment = await prisma.payment.findFirst({ where: { id: input.paymentId, tenantId: input.tenantId } });
  if (!payment) throw new NotFoundError("Pagamento não encontrado.");
  if (payment.method !== "PIX") throw new AppError("NOT_PIX", "Este pagamento não é PIX.");
  if (payment.status === "PAID") return payment;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", confirmedAt: new Date(), operatorId: input.userId, sessionId: session.id },
  });
  const saleKey = `sale-${payment.id}`;
  const existingSale = await prisma.cashMovement.findFirst({
    where: { tenantId: input.tenantId, idempotencyKey: saleKey },
  });
  if (!existingSale) {
    await prisma.cashMovement.create({
      data: {
        tenantId: input.tenantId,
        sessionId: session.id,
        type: "SALE",
        amountCents: payment.amountCents,
        method: "PIX",
        operatorId: session.operatorId,
        orderId: payment.orderId,
        paymentId: payment.id,
        idempotencyKey: saleKey,
      },
    });
  }
  await maybeCompleteOrder(input.tenantId, payment.orderId, input.userId);
  await writeAudit({
    action: "UPDATE",
    entity: "Payment",
    entityId: payment.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { method: "PIX", confirmed: true },
  });
  return payment;
}

async function maybeCompleteOrder(tenantId: string, orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { payments: true },
  });
  if (!order) return;
  const live = order.payments.filter((row) => row.status !== "CANCELLED" && row.status !== "FAILED");
  const paid = live.filter((row) => row.status === "PAID").reduce((sum, row) => sum + row.amountCents, 0);
  if (paid < order.totalCents) return;
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", status: order.status === "PENDING" ? "CONFIRMED" : order.status },
  });
  if (order.fulfillment === "DINE_IN") await freeTablesForOrder(tenantId, order.id);
  await writeAudit({
    action: "UPDATE",
    entity: "Order",
    entityId: order.id,
    tenantId,
    userId,
    metadata: { paymentStatus: "PAID", source: "cashier-receive" },
  });
}

function dominantMethod(tenders: CashTenderInput[]): PaymentMethod {
  const ranked = [...tenders].sort((a, b) => b.amountCents - a.amountCents)[0];
  return ranked?.method ?? "OTHER";
}

export async function registerCashMovement(input: {
  tenantId: string;
  userId: string;
  type: "SANGRIA" | "SUPPLY" | "EXPENSE";
  amountCents: number;
  reason?: string;
  notes?: string;
  authorizationId?: string;
  idempotencyKey: string;
}) {
  const session = await requireOpenSession(input.tenantId, input.userId);
  await assertCanOperateOpenSession({ tenantId: input.tenantId, userId: input.userId, session });
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new AppError("INVALID_AMOUNT", "Informe um valor válido.");
  }
  const duplicate = await prisma.cashMovement.findFirst({
    where: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey },
  });
  if (duplicate) return duplicate;

  if (input.type === "EXPENSE") {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: input.tenantId },
      select: { cashierCanRegisterExpense: true },
    });
    const manager = await prisma.tenantMembership.findFirst({
      where: { tenantId: input.tenantId, userId: input.userId, role: { in: ["OWNER", "MANAGER"] } },
    });
    if (!tenant.cashierCanRegisterExpense && !manager) {
      if (!input.authorizationId) {
        throw new ForbiddenError("Você não possui permissão para registrar despesas.");
      }
      await consumeAuthorization({
        tenantId: input.tenantId,
        authorizationId: input.authorizationId,
        kind: "EXPENSE",
      });
    }
  }

  if (input.type === "SANGRIA") {
    const totals = await sessionTotals(session.id, input.tenantId);
    if (input.amountCents > totals.expectedCashCents) {
      throw new AppError("SANGRIA_EXCEEDS_CASH", "A sangria não pode ser maior que o saldo físico esperado.");
    }
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: input.tenantId },
      select: { cashLimitCents: true },
    });
    if (tenant.cashLimitCents > 0 && input.amountCents > tenant.cashLimitCents) {
      await notifyCash(
        input.tenantId,
        "Sangria acima do limite",
        `Sangria de valor elevado no caixa ${session.publicCode}.`,
      );
    }
  }

  const movement = await prisma.cashMovement.create({
    data: {
      tenantId: input.tenantId,
      sessionId: session.id,
      type: input.type,
      amountCents: input.amountCents,
      method: "CASH",
      reason: input.reason?.trim() || null,
      notes: input.notes?.trim() || null,
      operatorId: session.operatorId,
      idempotencyKey: input.idempotencyKey,
    },
  });
  await writeAudit({
    action: "CREATE",
    entity: "CashMovement",
    entityId: movement.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { type: input.type, amountCents: input.amountCents, reason: input.reason },
  });
  return movement;
}

export async function listSessionMovements(tenantId: string, sessionId?: string) {
  const session = sessionId
    ? await prisma.cashSession.findFirst({ where: { id: sessionId, tenantId } })
    : await requireOpenSession(tenantId);
  if (!session) throw new NotFoundError("Caixa não encontrado.");
  return prisma.cashMovement.findMany({
    where: { tenantId, sessionId: session.id },
    include: { operator: { select: { name: true } }, order: { select: { publicCode: true, number: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function previewCashCount(tenantId: string, userId?: string) {
  const session = await requireOpenSession(tenantId, userId);
  const totals = await sessionTotals(session.id, tenantId);
  return { session, totals };
}

export async function closeCashSession(input: {
  tenantId: string;
  userId: string;
  countedCents: number;
  note?: string;
  confirm: boolean;
}) {
  if (!input.confirm) throw new AppError("CONFIRM_REQUIRED", "Confirme o fechamento do caixa.");
  const session = await requireOpenSession(input.tenantId, input.userId);
  await assertCanOperateOpenSession({ tenantId: input.tenantId, userId: input.userId, session });
  if (session.status !== "OPEN") {
    throw new ConflictError("Este caixa já foi fechado.");
  }
  if (!Number.isInteger(input.countedCents) || input.countedCents < 0) {
    throw new AppError("INVALID_COUNT", "Informe o dinheiro contado.");
  }
  const totals = await sessionTotals(session.id, input.tenantId);
  const expected = totals.expectedCashCents;
  const difference = differenceCents(expected, input.countedCents);
  const closed = await prisma.$transaction(async (tx) => {
    const updated = await tx.cashSession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closedById: input.userId,
        closedAt: new Date(),
        countedCents: input.countedCents,
        expectedCents: expected,
        differenceCents: difference,
        closingNote: input.note?.trim() || null,
        conferenceStatus: "PENDING",
      },
    });
    await tx.cashMovement.create({
      data: {
        tenantId: input.tenantId,
        sessionId: session.id,
        type: "CLOSING",
        amountCents: input.countedCents,
        method: "CASH",
        operatorId: session.operatorId,
        notes: input.note?.trim() || null,
        idempotencyKey: `close-${session.id}`,
      },
    });
    return updated;
  });
  await writeAudit({
    action: "UPDATE",
    entity: "CashSession",
    entityId: session.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: {
      countedCents: input.countedCents,
      expectedCents: expected,
      differenceCents: difference,
      salesCents: totals.salesCents,
      conferenceStatus: "PENDING",
    },
  });
  printSafe({ type: "RECEIPT", tenantId: input.tenantId, payload: { sessionId: session.id, kind: "close" } });
  return { session: closed, totals, difference, differenceLabel: differenceLabel(difference) };
}

export async function listOwnClosings(tenantId: string, userId: string) {
  const rows = await prisma.cashSession.findMany({
    where: { tenantId, OR: [{ operatorId: userId }, { openedById: userId }], status: "CLOSED" },
    include: { terminal: true, payments: true, movements: true },
    orderBy: { closedAt: "desc" },
    take: 40,
  });
  return rows.map((row) => {
    const paid = row.payments.filter((item) => item.status === "PAID");
    const sum = (method: string, cardKind?: string) =>
      paid
        .filter((item) => item.method === method && (cardKind ? item.cardKind === cardKind : true))
        .reduce((total, item) => total + item.amountCents, 0);
    return {
      ...row,
      salesCents: paid.reduce((total, item) => total + item.amountCents, 0),
      cashCents: sum("CASH"),
      pixCents: sum("PIX"),
      cardCents: paid.filter((item) => item.method === "CARD").reduce((total, item) => total + item.amountCents, 0),
      sangriaCents: row.movements
        .filter((item) => item.type === "SANGRIA" && item.status === "ACTIVE")
        .reduce((total, item) => total + item.amountCents, 0),
    };
  });
}

export async function authorizeManager(input: {
  tenantId: string;
  requestedById: string;
  login: string;
  password: string;
  kind: "DISCOUNT" | "PAYMENT_CANCEL" | "REFUND" | "EXPENSE" | "CLOSE_OVERRIDE";
  reason: string;
  amountCents?: number;
  orderId?: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new AppError("REASON_REQUIRED", "Informe o motivo da autorização.");
  const login = input.login.trim().toLowerCase();
  const manager = await prisma.user.findFirst({
    where: {
      bannedAt: null,
      OR: [{ username: login }, { email: login }],
      memberships: { some: { tenantId: input.tenantId, role: { in: ["OWNER", "MANAGER"] } } },
    },
    include: { accounts: true },
  });
  const account = manager?.accounts.find((row) => row.providerId === "credential" && row.password);
  const valid = account?.password ? await verifyPassword({ hash: account.password, password: input.password }) : false;
  if (!manager || !valid) {
    await writeAudit({
      action: "UPDATE",
      entity: "CashAuthorization",
      tenantId: input.tenantId,
      userId: input.requestedById,
      metadata: { result: "denied", kind: input.kind },
    });
    throw new ForbiddenError("Autorização recusada.");
  }

  const session = await getOpenSession(input.tenantId);
  const row = await prisma.cashAuthorization.create({
    data: {
      tenantId: input.tenantId,
      sessionId: session?.id,
      kind: input.kind,
      status: "APPROVED",
      requestedById: input.requestedById,
      authorizedById: manager.id,
      reason,
      amountCents: input.amountCents ?? null,
      orderId: input.orderId ?? null,
      resolvedAt: new Date(),
    },
  });
  await writeAudit({
    action: "CREATE",
    entity: "CashAuthorization",
    entityId: row.id,
    tenantId: input.tenantId,
    userId: manager.id,
    metadata: { kind: input.kind, reason, amountCents: input.amountCents, orderId: input.orderId },
  });
  return row;
}

async function consumeAuthorization(input: {
  tenantId: string;
  authorizationId: string;
  kind: "DISCOUNT" | "PAYMENT_CANCEL" | "REFUND" | "EXPENSE";
  orderId?: string;
}) {
  const row = await prisma.cashAuthorization.findFirst({
    where: { id: input.authorizationId, tenantId: input.tenantId },
  });
  if (!row || row.status !== "APPROVED" || row.kind !== input.kind) {
    throw new ForbiddenError("Autorização inválida ou expirada.");
  }
  if (input.orderId && row.orderId && row.orderId !== input.orderId) {
    throw new ForbiddenError("Autorização não vale para este pedido.");
  }
  await prisma.cashAuthorization.update({
    where: { id: row.id },
    data: { status: "USED", resolvedAt: row.resolvedAt ?? new Date() },
  });
}

export async function cancelPayment(input: {
  tenantId: string;
  userId: string;
  paymentId: string;
  reason: string;
  authorizationId: string;
}) {
  const payment = await prisma.payment.findFirst({ where: { id: input.paymentId, tenantId: input.tenantId } });
  if (!payment) throw new NotFoundError("Pagamento não encontrado.");
  if (payment.status === "CANCELLED") throw new ConflictError("Este pagamento já foi cancelado.");
  await consumeAuthorization({
    tenantId: input.tenantId,
    authorizationId: input.authorizationId,
    kind: "PAYMENT_CANCEL",
    orderId: payment.orderId,
  });
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: input.reason.trim(),
      },
    });
    const sessionId = payment.sessionId;
    if (sessionId) {
      await tx.cashMovement.create({
        data: {
          tenantId: input.tenantId,
          sessionId,
          type: "REFUND",
          amountCents: payment.amountCents,
          method: payment.method,
          operatorId: input.userId,
          orderId: payment.orderId,
          paymentId: payment.id,
          notes: input.reason.trim(),
          idempotencyKey: `cancel-${payment.id}`,
        },
      });
    }
    await tx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "PENDING" },
    });
  });
  await writeAudit({
    action: "UPDATE",
    entity: "Payment",
    entityId: payment.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { status: "CANCELLED", reason: input.reason },
  });
}

export async function requestRefund(input: {
  tenantId: string;
  userId: string;
  paymentId: string;
  reason: string;
  authorizationId: string;
}) {
  const payment = await prisma.payment.findFirst({ where: { id: input.paymentId, tenantId: input.tenantId } });
  if (!payment) throw new NotFoundError("Pagamento não encontrado.");
  await consumeAuthorization({
    tenantId: input.tenantId,
    authorizationId: input.authorizationId,
    kind: "REFUND",
    orderId: payment.orderId,
  });
  const session = payment.sessionId
    ? await prisma.cashSession.findFirst({ where: { id: payment.sessionId, tenantId: input.tenantId } })
    : await getOpenSession(input.tenantId, { operatorId: input.userId });
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED", cancelReason: input.reason.trim(), cancelledAt: new Date() },
    });
    if (session) {
      await tx.cashMovement.create({
        data: {
          tenantId: input.tenantId,
          sessionId: session.id,
          type: "REFUND",
          amountCents: payment.amountCents,
          method: payment.method,
          operatorId: input.userId,
          orderId: payment.orderId,
          paymentId: payment.id,
          notes: input.reason.trim(),
          idempotencyKey: `refund-${payment.id}`,
        },
      });
    }
  });
  await writeAudit({
    action: "UPDATE",
    entity: "Payment",
    entityId: payment.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: { status: "REFUNDED", reason: input.reason },
  });
}

async function notifyCash(tenantId: string, title: string, body: string) {
  await prisma.notification.create({
    data: { tenantId, type: "CASH", title, body },
  });
}

function printSafe(job: { type: "RECEIPT" | "ORDER" | "KITCHEN"; tenantId: string; payload: unknown }) {
  void getPrintProvider()
    .print(job)
    .catch(() => undefined);
}

export async function printReceipt(tenantId: string, payload: unknown) {
  try {
    await getPrintProvider().print({ type: "RECEIPT", tenantId, payload });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Impressora não encontrada." };
  }
}

export type CashSessionWithOperator = Prisma.CashSessionGetPayload<{
  include: { terminal: true; openedBy: { select: { id: true; name: true } } };
}>;
