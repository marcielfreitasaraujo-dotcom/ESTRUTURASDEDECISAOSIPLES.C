import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { listOpenFloorOrders } from "@/server/services/pos";
import { StaffOrderForm } from "@/components/staff-order-form";
import { formatBRL } from "@/lib/money";

export default async function WaiterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.ORDER_CREATE);
  const [{ error, ok }, catalog, open] = await Promise.all([
    searchParams,
    listCatalog(ctx.tenantId),
    listOpenFloorOrders(ctx.tenantId),
  ]);
  const errorMessage =
    error === "table"
      ? "Informe o número da mesa."
      : error
        ? decodeURIComponent(error)
        : undefined;

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm text-primary">Comanda no salão</p>
        <h1 className="text-3xl font-semibold">Nova mesa</h1>
        <p className="mt-1 text-sm text-muted-foreground">O preço sai do servidor. A cozinha recebe na hora.</p>
      </div>
      <StaffOrderForm
        mode="waiter"
        products={catalog.products}
        sizes={catalog.sizes}
        flavors={catalog.flavors}
        crusts={catalog.crusts}
        error={errorMessage}
        ok={ok}
      />
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Abertas agora</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma comanda aberta.</p>
        ) : (
          <ul className="grid gap-3">
            {open.slice(0, 8).map((order) => (
              <li key={order.id} className="rounded-xl border bg-card p-4">
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
      </section>
    </div>
  );
}
