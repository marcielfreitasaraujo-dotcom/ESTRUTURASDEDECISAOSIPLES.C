import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { listOpenFloorOrders } from "@/server/services/pos";
import { StaffOrderForm } from "@/components/staff-order-form";
import { markOrderPaidAction } from "@/app/actions/pos";
import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";

export default async function CashierPage({
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

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
      <div className="grid gap-6">
        <div>
          <p className="text-sm text-primary">Ponto de venda</p>
          <h1 className="text-3xl font-semibold">Caixa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Venda no balcão e recebimento das mesas. Tudo cai no mesmo banco na nuvem.
          </p>
        </div>
        <StaffOrderForm
          mode="cashier"
          products={catalog.products}
          sizes={catalog.sizes}
          flavors={catalog.flavors}
          crusts={catalog.crusts}
          error={error ? decodeURIComponent(error) : undefined}
          ok={ok}
        />
      </div>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Abertas</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Fila vazia.</p>
        ) : (
          <ul className="grid gap-3">
            {open.map((order) => (
              <li key={order.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono">
                    #{order.publicCode}
                    {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-sm">{order.customerName}</p>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-medium">{formatBRL(order.totalCents)}</p>
                <p className="text-xs text-muted-foreground">
                  {order.paymentMethod} · {order.paymentStatus === "PAID" ? "Pago" : "A receber"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.paymentStatus !== "PAID" ? (
                    <form action={markOrderPaidAction} method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button type="submit" size="sm">
                        Receber
                      </Button>
                    </form>
                  ) : null}
                  {order.status === "READY" ? (
                    <form action={updateOrderStatusFormAction} method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="toStatus" value="DELIVERED" />
                      <Button type="submit" size="sm" variant="outline">
                        Entregar
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
