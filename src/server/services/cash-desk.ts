import type { CashConferenceStatus, CashSessionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ConflictError, ForbiddenError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { cashPeriodRange, type CashPeriodPreset } from "@/domain/cash/period";
import { cashSessionUiStatus, operatorLabel } from "@/domain/cash/status";
import { differenceCents, differenceLabel } from "@/domain/cash/math";
import { sessionTotals, ensureDefaultTerminals } from "@/server/services/cash";
import { actorManagesCash, assertCanViewCashSession, getCashSessionOrThrow } from "@/server/services/cash-access";

export type CashSessionFilters = {
  period?: CashPeriodPreset | string;
  from?: string | null;
  to?: string | null;
  operatorId?: string | null;
  terminalId?: string | null;
  status?: string | null;
  difference?: string | null;
  query?: string | null;
  take?: number;
};

function sessionWhere(tenantId: string, filters: CashSessionFilters): Prisma.CashSessionWhereInput {
  const range = cashPeriodRange(filters.period, filters.from, filters.to);
  const query = filters.query?.trim();
  const status = filters.status?.trim();
  const difference = filters.difference?.trim();

  const where: Prisma.CashSessionWhereInput = {
    tenantId,
    ...(filters.operatorId ? { operatorId: filters.operatorId } : {}),
    ...(filters.terminalId ? { terminalId: filters.terminalId } : {}),
    ...(range ? { openedAt: range } : {}),
  };

  if (query) {
    where.OR = [
      { publicCode: { contains: query, mode: "insensitive" } },
      { operator: { name: { contains: query, mode: "insensitive" } } },
      { operator: { displayName: { contains: query, mode: "insensitive" } } },
      { terminal: { name: { contains: query, mode: "insensitive" } } },
      { terminal: { code: { contains: query, mode: "insensitive" } } },
    ];
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(query)) {
      const [day, month, year] = query.split("/").map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      where.OR.push({ openedAt: { gte: start, lte: end } });
    }
  }

  if (status === "open") where.status = "OPEN";
  else if (status === "closed") where.status = "CLOSED";
  else if (status === "pending") {
    where.status = "CLOSED";
    where.conferenceStatus = "PENDING";
  } else if (status === "conferred") where.conferenceStatus = "CONFERRED";
  else if (status === "difference") {
    where.OR = [{ conferenceStatus: "DIFFERENCE" }, { differenceCents: { not: 0 } }];
    where.status = "CLOSED";
  }

  if (difference === "none") where.differenceCents = 0;
  if (difference === "shortage") where.differenceCents = { lt: 0 };
  if (difference === "overage") where.differenceCents = { gt: 0 };

  return where;
}

const sessionInclude = {
  terminal: true,
  operator: { select: { id: true, name: true, displayName: true, operatorCode: true } },
  openedBy: { select: { id: true, name: true, displayName: true } },
  closedBy: { select: { id: true, name: true, displayName: true } },
  conferredBy: { select: { id: true, name: true, displayName: true } },
} satisfies Prisma.CashSessionInclude;

function toRow(session: Prisma.CashSessionGetPayload<{ include: typeof sessionInclude }>, totals: Awaited<ReturnType<typeof sessionTotals>>) {
  const ui = cashSessionUiStatus(session);
  return {
    id: session.id,
    publicCode: session.publicCode,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    status: session.status,
    conferenceStatus: session.conferenceStatus,
    ui,
    conferred: session.conferenceStatus === "CONFERRED" || session.conferenceStatus === "DIFFERENCE",
    operatorId: session.operatorId,
    operatorName: operatorLabel(session.operator),
    terminalId: session.terminalId,
    terminalName: session.terminal.name,
    openingCents: session.openingCents,
    countedCents: session.countedCents,
    expectedCents: session.expectedCents ?? totals.expectedCashCents,
    differenceCents: session.differenceCents ?? (session.countedCents != null ? session.countedCents - totals.expectedCashCents : null),
    conferenceNote: session.conferenceNote,
    conferredAt: session.conferredAt,
    conferredByName: session.conferredBy ? operatorLabel(session.conferredBy) : null,
    salesCents: totals.salesCents,
    cashCents: totals.cashSalesCents,
    pixCents: totals.pixCents,
    debitCents: totals.debitCents,
    creditCents: totals.creditCents,
    cardCents: totals.debitCents + totals.creditCents,
    sangriaCents: totals.sangriaCents,
    supplyCents: totals.supplyCents,
    expenseCents: totals.expenseCents,
    expectedCashCents: totals.expectedCashCents,
  };
}

export async function listCashDeskSessions(tenantId: string, filters: CashSessionFilters = {}) {
  const rows = await prisma.cashSession.findMany({
    where: sessionWhere(tenantId, filters),
    include: sessionInclude,
    orderBy: { openedAt: "desc" },
    take: filters.take ?? 400,
  });
  const mapped = await Promise.all(
    rows.map(async (row) => {
      const totals = await sessionTotals(row.id, tenantId);
      return toRow(row, totals);
    }),
  );
  return mapped;
}

export async function getCashDeskSnapshot(tenantId: string, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const [openRows, closedToday, pending, withDiff, todayPayments] = await Promise.all([
    prisma.cashSession.findMany({
      where: { tenantId, status: "OPEN" },
      include: sessionInclude,
    }),
    prisma.cashSession.count({ where: { tenantId, status: "CLOSED", closedAt: { gte: start } } }),
    prisma.cashSession.count({ where: { tenantId, status: "CLOSED", conferenceStatus: "PENDING" } }),
    prisma.cashSession.count({
      where: {
        tenantId,
        status: "CLOSED",
        OR: [{ conferenceStatus: "DIFFERENCE" }, { differenceCents: { not: 0 } }],
      },
    }),
    prisma.payment.aggregate({
      where: { tenantId, status: "PAID", createdAt: { gte: start } },
      _sum: { amountCents: true },
    }),
  ]);
  const openWithTotals = await Promise.all(
    openRows.map(async (row) => {
      const totals = await sessionTotals(row.id, tenantId);
      return {
        ...toRow(row, totals),
        openedLong: now.getTime() - row.openedAt.getTime() > 12 * 60 * 60 * 1000,
      };
    }),
  );
  const alerts: { id: string; tone: "warn" | "alert" | "info"; title: string; detail: string; href: string }[] = [];
  for (const row of openWithTotals) {
    if (row.openedLong) {
      alerts.push({
        id: `long-${row.id}`,
        tone: "warn",
        title: "Caixa aberto há muito tempo",
        detail: `${row.terminalName} · ${row.operatorName}`,
        href: `/app/caixas/${row.id}`,
      });
    }
  }
  if (pending > 0) {
    alerts.push({
      id: "pending-conference",
      tone: "warn",
      title: "Caixas aguardando conferência",
      detail: `${pending} turno(s) fechado(s) sem conferência`,
      href: "/app/caixas?status=pending",
    });
  }
  if (withDiff > 0) {
    alerts.push({
      id: "cash-diff",
      tone: "alert",
      title: "Caixas com diferença",
      detail: `${withDiff} sessão(ões) com falta ou sobra`,
      href: "/app/caixas?status=difference",
    });
  }
  return {
    openCount: openRows.length,
    closedToday,
    pendingConference: pending,
    withDifference: withDiff,
    salesTodayCents: todayPayments._sum.amountCents ?? 0,
    cashInDrawersCents: openWithTotals.reduce((sum, row) => sum + row.expectedCashCents, 0),
    openSessions: openWithTotals,
    alerts,
  };
}

export async function getCashSessionDetail(input: {
  tenantId: string;
  userId: string;
  role?: string | null;
  sessionId: string;
}) {
  const session = await getCashSessionOrThrow(input.tenantId, input.sessionId);
  await assertCanViewCashSession({
    tenantId: input.tenantId,
    userId: input.userId,
    session,
    role: input.role,
  });
  const totals = await sessionTotals(session.id, input.tenantId);
  const [movements, payments, orders, audit] = await Promise.all([
    prisma.cashMovement.findMany({
      where: { tenantId: input.tenantId, sessionId: session.id },
      include: { operator: { select: { name: true, displayName: true } }, order: { select: { publicCode: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({
      where: { tenantId: input.tenantId, sessionId: session.id },
      include: { order: { select: { publicCode: true, customerName: true } }, operator: { select: { name: true, displayName: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: {
        tenantId: input.tenantId,
        payments: { some: { sessionId: session.id } },
      },
      select: {
        id: true,
        publicCode: true,
        createdAt: true,
        customerName: true,
        tableNumber: true,
        totalCents: true,
        status: true,
        paymentStatus: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: input.tenantId,
        OR: [
          { entity: "CashSession", entityId: session.id },
          { entity: "CashMovement", metadata: { path: ["sessionId"], equals: session.id } },
          { entity: "Payment", metadata: { path: ["sessionId"], equals: session.id } },
        ],
      },
      include: { user: { select: { name: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: input.tenantId },
    select: { name: true, tradeName: true },
  });

  return {
    session,
    tenantName: tenant.tradeName || tenant.name,
    totals,
    ui: cashSessionUiStatus(session),
    differenceLabel: differenceLabel(session.differenceCents ?? 0),
    movements,
    payments,
    orders,
    withdrawals: movements.filter((row) => row.type === "SANGRIA"),
    supplies: movements.filter((row) => row.type === "SUPPLY"),
    expenses: movements.filter((row) => row.type === "EXPENSE"),
    audit,
  };
}

export async function conferCashSession(input: {
  tenantId: string;
  userId: string;
  sessionId: string;
  note?: string;
}) {
  if (!(await actorManagesCash(input.tenantId, input.userId))) {
    throw new ForbiddenError("Somente gerente, proprietário ou admin podem conferir o caixa.");
  }
  const session = await getCashSessionOrThrow(input.tenantId, input.sessionId);
  if (session.status !== "CLOSED") {
    throw new ConflictError("O caixa precisa estar fechado para ser conferido.");
  }
  const totals = await sessionTotals(session.id, input.tenantId);
  const expected = session.expectedCents ?? totals.expectedCashCents;
  const counted = session.countedCents ?? expected;
  const difference = session.differenceCents ?? differenceCents(expected, counted);
  const conferenceStatus: CashConferenceStatus = difference === 0 ? "CONFERRED" : "DIFFERENCE";
  const updated = await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      conferenceStatus,
      conferredById: input.userId,
      conferredAt: new Date(),
      conferenceNote: input.note?.trim() || session.conferenceNote,
      expectedCents: expected,
      differenceCents: difference,
    },
  });
  await writeAudit({
    action: "UPDATE",
    entity: "CashSession",
    entityId: session.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: {
      action: "CONFERENCE",
      conferenceStatus,
      expectedCents: expected,
      countedCents: counted,
      differenceCents: difference,
      note: input.note,
    },
  });
  return updated;
}

export async function adjustCashSession(input: {
  tenantId: string;
  userId: string;
  sessionId: string;
  amountCents: number;
  reason: string;
}) {
  if (!(await actorManagesCash(input.tenantId, input.userId))) {
    throw new ForbiddenError("Somente gerente, proprietário ou admin podem ajustar o caixa.");
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents === 0) {
    throw new AppError("INVALID_AMOUNT", "Informe um valor de ajuste válido.");
  }
  const reason = input.reason.trim();
  if (reason.length < 3) throw new AppError("REASON_REQUIRED", "Informe o motivo do ajuste.");
  const session = await getCashSessionOrThrow(input.tenantId, input.sessionId);
  const movement = await prisma.cashMovement.create({
    data: {
      tenantId: input.tenantId,
      sessionId: session.id,
      type: "ADJUSTMENT",
      amountCents: input.amountCents,
      method: "CASH",
      reason,
      operatorId: input.userId,
      notes: reason,
      idempotencyKey: `adjust-${session.id}-${Date.now()}`,
    },
  });
  const totals = await sessionTotals(session.id, input.tenantId);
  if (session.status === "CLOSED" && session.countedCents != null) {
    const difference = differenceCents(totals.expectedCashCents, session.countedCents);
    await prisma.cashSession.update({
      where: { id: session.id },
      data: {
        expectedCents: totals.expectedCashCents,
        differenceCents: difference,
        conferenceStatus:
          session.conferenceStatus === "PENDING"
            ? "PENDING"
            : difference === 0
              ? "CONFERRED"
              : "DIFFERENCE",
      },
    });
  }
  await writeAudit({
    action: "UPDATE",
    entity: "CashMovement",
    entityId: movement.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: {
      action: "ADJUSTMENT",
      sessionId: session.id,
      amountCents: input.amountCents,
      previousExpected: session.expectedCents,
      reason,
    },
  });
  return movement;
}

export async function listCashTerminals(tenantId: string) {
  await ensureDefaultTerminals(tenantId);
  return prisma.cashTerminal.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function upsertCashTerminal(input: {
  tenantId: string;
  userId: string;
  id?: string;
  name: string;
  code?: string;
  description?: string;
  active?: boolean;
}) {
  if (!(await actorManagesCash(input.tenantId, input.userId))) {
    throw new ForbiddenError("Sem permissão para gerenciar terminais.");
  }
  const name = input.name.trim();
  if (name.length < 2) throw new AppError("INVALID_TERMINAL", "Informe o nome do terminal.");
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `caixa-${Date.now()}`;
  if (input.id) {
    const updated = await prisma.cashTerminal.update({
      where: { id: input.id },
      data: {
        name,
        code: input.code?.trim() || null,
        description: input.description?.trim() || null,
        active: input.active ?? true,
      },
    });
    await writeAudit({
      action: "UPDATE",
      entity: "CashTerminal",
      entityId: updated.id,
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: { name, active: updated.active },
    });
    return updated;
  }
  const count = await prisma.cashTerminal.count({ where: { tenantId: input.tenantId } });
  try {
    const created = await prisma.cashTerminal.create({
      data: {
        tenantId: input.tenantId,
        name,
        slug,
        code: input.code?.trim() || `CX${String(count + 1).padStart(2, "0")}`,
        description: input.description?.trim() || null,
        sortOrder: count,
        active: input.active ?? true,
      },
    });
    await writeAudit({
      action: "CREATE",
      entity: "CashTerminal",
      entityId: created.id,
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: { name },
    });
    return created;
  } catch {
    throw new ConflictError("Já existe um terminal com este nome.");
  }
}

export async function cashReports(tenantId: string, filters: CashSessionFilters) {
  const rows = await listCashDeskSessions(tenantId, { ...filters, take: 2000 });
  const byOperator = new Map<
    string,
    {
      operatorName: string;
      sessions: number;
      salesCents: number;
      cashCents: number;
      pixCents: number;
      debitCents: number;
      creditCents: number;
      sangriaCents: number;
      supplyCents: number;
      expenseCents: number;
      differenceCents: number;
    }
  >();
  const byTerminal = new Map<string, { terminalName: string; sessions: number; salesCents: number; differenceCents: number }>();
  for (const row of rows) {
    const operator = byOperator.get(row.operatorId) ?? {
      operatorName: row.operatorName,
      sessions: 0,
      salesCents: 0,
      cashCents: 0,
      pixCents: 0,
      debitCents: 0,
      creditCents: 0,
      sangriaCents: 0,
      supplyCents: 0,
      expenseCents: 0,
      differenceCents: 0,
    };
    operator.sessions += 1;
    operator.salesCents += row.salesCents;
    operator.cashCents += row.cashCents;
    operator.pixCents += row.pixCents;
    operator.debitCents += row.debitCents;
    operator.creditCents += row.creditCents;
    operator.sangriaCents += row.sangriaCents;
    operator.supplyCents += row.supplyCents;
    operator.expenseCents += row.expenseCents;
    operator.differenceCents += row.differenceCents ?? 0;
    byOperator.set(row.operatorId, operator);

    const terminal = byTerminal.get(row.terminalId) ?? {
      terminalName: row.terminalName,
      sessions: 0,
      salesCents: 0,
      differenceCents: 0,
    };
    terminal.sessions += 1;
    terminal.salesCents += row.salesCents;
    terminal.differenceCents += row.differenceCents ?? 0;
    byTerminal.set(row.terminalId, terminal);
  }
  return {
    rows,
    byOperator: [...byOperator.values()],
    byTerminal: [...byTerminal.values()],
    differences: rows.filter((row) => (row.differenceCents ?? 0) !== 0),
    sangrias: rows.filter((row) => row.sangriaCents > 0),
    supplies: rows.filter((row) => row.supplyCents > 0),
    expenses: rows.filter((row) => row.expenseCents > 0),
  };
}

export function conferenceCsv(rows: Awaited<ReturnType<typeof listCashDeskSessions>>, tenantName: string) {
  const header = [
    "Código",
    "Estabelecimento",
    "Abertura",
    "Fechamento",
    "Situação",
    "Conferido",
    "Operador",
    "Terminal",
    "Saldo inicial",
    "Vendas",
    "Dinheiro",
    "PIX",
    "Cartões",
    "Sangrias",
    "Suprimentos",
    "Despesas",
    "Saldo esperado",
    "Saldo contado",
    "Diferença",
    "Conferente",
  ];
  const money = (cents: number | null | undefined) => ((cents ?? 0) / 100).toFixed(2).replace(".", ",");
  const lines = rows.map((row) =>
    [
      row.publicCode,
      tenantName,
      row.openedAt.toISOString(),
      row.closedAt?.toISOString() ?? "",
      row.ui.label,
      row.conferred ? "SIM" : "NÃO",
      row.operatorName,
      row.terminalName,
      money(row.openingCents),
      money(row.salesCents),
      money(row.cashCents),
      money(row.pixCents),
      money(row.cardCents),
      money(row.sangriaCents),
      money(row.supplyCents),
      money(row.expenseCents),
      money(row.expectedCashCents),
      money(row.countedCents),
      money(row.differenceCents),
      row.conferredByName ?? "",
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(";"),
  );
  return `\uFEFF${[header.join(";"), ...lines].join("\n")}`;
}

export type CashSessionStatusFilter = CashSessionStatus;
export type CashConferenceFilter = CashConferenceStatus;
