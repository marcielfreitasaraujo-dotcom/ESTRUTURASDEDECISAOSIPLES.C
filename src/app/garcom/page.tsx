import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { getTenantTableCount, listOpenFloorOrders } from "@/server/services/pos";
import { salonTableNumbers } from "@/domain/floor/tables";
import { StaffOrderForm } from "@/components/staff-order-form";
import { formatBRL } from "@/lib/money";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, SurfaceHeader, StatCard } from "@/components/ds/surface";
import { EmptyState } from "@/components/empty-state";

export default async function WaiterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.ORDER_CREATE);
  const [{ error, ok }, catalog, open, tableCount] = await Promise.all([
    searchParams,
    listCatalog(ctx.tenantId),
    listOpenFloorOrders(ctx.tenantId),
    getTenantTableCount(ctx.tenantId),
  ]);
  const errorMessage =
    error === "table"
      ? "Informe o número da mesa."
      : error
        ? decodeURIComponent(error)
        : undefined;

  return (
    <PageStack>
      <PageHeader
        title="Nova mesa"
        description="O preço sai do servidor. A cozinha recebe na hora."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Comandas abertas" value={String(open.length)} />
        <StatCard label="Mesas no salão" value={String(tableCount)} />
        <StatCard label="Itens no cardápio" value={String(catalog.products.filter((product) => product.active !== false).length)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Surface>
          <SurfaceHeader title="Lançar pedido" description="Escolha a mesa e os itens da comanda." />
          <StaffOrderForm
            mode="waiter"
            products={catalog.products}
            sizes={catalog.sizes}
            flavors={catalog.flavors}
            crusts={catalog.crusts}
            error={errorMessage}
            ok={ok}
            availableTables={salonTableNumbers(tableCount)}
          />
        </Surface>
        <Surface>
          <SurfaceHeader title="Abertas agora" description="Toque no mapa de mesas para acompanhar o salão." />
          {open.length === 0 ? (
            <EmptyState title="Nenhuma comanda aberta" description="A primeira mesa do turno aparece aqui." />
          ) : (
            <ul className="grid gap-3">
              {open.slice(0, 8).map((order) => (
                <li key={order.id} className="rounded-xl border border-border px-4 py-3">
                  <p className="font-mono text-sm">
                    #{order.publicCode}
                    {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                  </p>
                  <p className="mt-1 text-sm font-medium">{formatBRL(order.totalCents)}</p>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </PageStack>
  );
}
