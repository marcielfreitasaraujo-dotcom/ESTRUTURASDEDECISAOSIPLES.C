import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getCashierDashboard } from "@/server/services/cash";
import { CashierDashboard } from "@/components/cashier/dashboard";
import { OpenCashForm } from "@/components/cashier/open-form";
import { ClosedCashState } from "@/components/cashier/closed-state";

export default async function CaixaInicioPage({
  searchParams,
}: {
  searchParams: Promise<{ abrir?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.CASH_OPERATE);
  const params = await searchParams;
  const data = await getCashierDashboard(ctx.tenantId);
  const session = data.session;
  const isOwnerOfOpen = session?.openedById === ctx.userId || ctx.tenantRole !== "CASHIER";

  if (session && !isOwnerOfOpen) {
    return (
      <OpenCashForm
        blocked={{
          operatorName: session.openedBy.name,
          openedAt: session.openedAt.toISOString(),
          terminalName: session.terminal.name,
        }}
      />
    );
  }

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
    return <OpenCashForm />;
  }

  return (
    <CashierDashboard
      data={{
        operatorName: ctx.name,
        tenantName: data.tenant.name,
        terminalName: data.terminal.name,
        cashLimitCents: data.tenant.cashLimitCents,
        cashOverLimit: data.cashOverLimit,
        session: {
          id: session.id,
          openedAt: session.openedAt.toISOString(),
          operatorName: session.openedBy.name,
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
        notifications: data.notifications,
      }}
    />
  );
}