import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getStoreControlCenter } from "@/server/services/dashboard";
import { ControlCenter } from "@/components/manager/control-center";

export default async function DashboardPage() {
  const ctx = await requirePage(PERMISSIONS.DASHBOARD_READ);
  const snapshot = await getStoreControlCenter(ctx.tenantId, { userName: ctx.name });
  return <ControlCenter initial={snapshot} />;
}
