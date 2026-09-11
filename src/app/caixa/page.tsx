import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listCatalog } from "@/server/services/catalog";
import { getFloorSnapshot } from "@/server/services/floor";
import { listTeam } from "@/server/services/team";
import { FloorMap } from "@/components/floor/floor-map";

export default async function CashierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.ORDER_CREATE);
  const [{ error, ok }, catalog, snapshot, team] = await Promise.all([
    searchParams,
    listCatalog(ctx.tenantId),
    getFloorSnapshot(ctx.tenantId),
    listTeam(ctx.tenantId),
  ]);
  const canSettle =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.ORDER_UPDATE) : false);
  const waiters = team
    .filter((member) => ["WAITER", "STAFF", "CASHIER", "OWNER", "MANAGER"].includes(member.role))
    .map((member) => ({ id: member.user.id, name: member.user.name }));

  return (
    <FloorMap
      initial={snapshot}
      catalog={{
        products: catalog.products,
        sizes: catalog.sizes,
        flavors: catalog.flavors,
        crusts: catalog.crusts,
      }}
      waiters={waiters}
      canSettle={canSettle}
      orderFeedback={{
        error: error ? decodeURIComponent(error) : undefined,
        ok,
      }}
    />
  );
}
