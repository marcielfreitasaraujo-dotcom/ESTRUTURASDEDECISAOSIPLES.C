import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getCashierDashboard } from "@/server/services/cash";
import { CashierDashboard } from "@/components/cashier/dashboard";
import { OpenCashForm } from "@/components/cashier/open-form";
import { ClosedCashState } from "@/components/cashier/closed-state";
import { operatorLabel } from "@/domain/cash/status";
import { isStoreGerente } from "@/domain/rbac/roles";

export default async function CaixaInicioPage({
  searchParams,
}: {
  searchParams: Promise<{ abrir?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.CASH_OPERATE);
  const params = await searchParams;
  const data = await getCashierDashboard(ctx.tenantId, ctx.userId);
  const session = data.session;
  const lockOperator = ctx.tenantRole === "CASHIER";
  const operators = lockOperator
    ? data.operators.filter((row) => row.id === ctx.userId)
    : data.operators;

  if (!session && data.lastClosed && params.abrir !== "1") {
    const sales = data.lastClosed;
    return (
      <ClosedCashState
        closedAt={(sales.closedAt ?? sales.openedAt).toISOString()}
        salesCents={sales.salesCents}
        differenceCents={sales.differenceCents ?? 0}
      />
    );
  }

  if (!session) {
    return (
      <OpenCashForm
        operators={operators.length ? operators : [{ id: ctx.userId, name: ctx.name }]}
        terminals={data.terminals}
        defaultOperatorId={ctx.userId}
        lockOperator={lockOperator}
      />
    );
  }

  return (
    <CashierDashboard
      data={{
        operatorName: ctx.name,
        tenantName: data.tenant.name,
        terminalName: session.terminal.name,
        sessionCode: session.publicCode,
        cashLimitCents: data.tenant.cashLimitCents,
        cashOverLimit: data.cashOverLimit,
        canManage: isStoreGerente(ctx.tenantRole),
        session: {
          id: session.id,
          openedAt: session.openedAt.toISOString(),
          operatorName: operatorLabel(session.operator ?? session.openedBy),
          openingCents: session.openingCents,
        },
        lastClosed: null,
        totals: data.totals,
        pending: data.pending.map((order) => ({
          id: order.id,
          publicCode: order.publicCode,
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          totalCents: order.totalCents,
        })),
        movements: data.movements.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          type: row.type,
          amountCents: row.amountCents,
          notes: row.notes,
          orderCode: row.order?.publicCode ?? null,
        })),
        notifications: data.notifications.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
        })),
        paymentSummary: {
          cashCents: data.totals.cashSalesCents,
          pixCents: data.totals.pixCents,
          debitCents: data.totals.debitCents,
          creditCents: data.totals.creditCents,
          otherCents: data.totals.otherCents,
          cashCount: data.totals.cashCount,
          pixCount: data.totals.pixCount,
          debitCount: data.totals.debitCount,
          creditCount: data.totals.creditCount,
          otherCount: data.totals.otherCount,
        },
      }}
    />
  );
}
