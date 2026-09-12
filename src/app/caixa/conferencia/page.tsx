import { requireOpenCashPage } from "@/server/cash-page";
import { previewCashCount } from "@/server/services/cash";
import { CloseCashPanel } from "@/components/cashier/close-panel";
import { operatorLabel } from "@/domain/cash/status";

export default async function ConferenciaPage() {
  const ctx = await requireOpenCashPage();
  const { session, totals } = await previewCashCount(ctx.tenantId, ctx.userId);
  return (
    <CloseCashPanel
      mode="count"
      operatorName={operatorLabel(session.operator ?? session.openedBy)}
      openedAt={session.openedAt.toISOString()}
      totals={totals}
    />
  );
}