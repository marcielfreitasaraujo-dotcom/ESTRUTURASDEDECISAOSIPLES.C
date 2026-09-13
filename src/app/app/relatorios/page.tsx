import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getSalesReport } from "@/server/services/dashboard";
import { ReportsPanel } from "@/components/manager/reports-panel";

export default async function RelatoriosPage() {
  const ctx = await requirePage(PERMISSIONS.FINANCE_READ);
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const report = await getSalesReport(ctx.tenantId, from, now);
  return <ReportsPanel report={report} />;
}
