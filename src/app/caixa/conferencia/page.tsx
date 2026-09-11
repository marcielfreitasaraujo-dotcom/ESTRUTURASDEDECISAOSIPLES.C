import { requireOpenCashPage } from "@/server/cash-page";
import { previewCashCount } from "@/server/services/cash";
import { CloseCashPanel } from "@/components/cashier/close-panel";

export default async function ConferenciaPage() {
  const ctx = await requireOpenCashPage();
  const { session, totals } = await previewCashCount(ctx.tenantId);
  return (
    <CloseCashPanel
      mode="count"
      operatorName={session.openedBy.name}
      openedAt={session.openedAt.toISOString()}
      totals={totals}
    />
  );
}