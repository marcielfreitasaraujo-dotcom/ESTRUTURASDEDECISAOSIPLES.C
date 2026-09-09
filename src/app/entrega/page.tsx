import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listDeliveryOps } from "@/server/services/ops";
import { assignDeliveryAction } from "@/app/actions/ops";
import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/money";

function addressOf(order: {
  street: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  city: string | null;
}) {
  return [order.street, order.addressNumber, order.neighborhood, order.city].filter(Boolean).join(", ") || "Sem endereço";
}

export default async function EntregaPage() {
  const ctx = await requirePage(PERMISSIONS.DELIVERY_UPDATE);
  const { queue, drivers } = await listDeliveryOps(ctx.tenantId);
  const ready = queue.filter((order) => order.status === "READY");
  const out = queue.filter((order) => order.status === "OUT_FOR_DELIVERY");

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm text-primary">Entrega</p>
        <h1 className="text-3xl font-semibold">Fila do motoboy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pedidos prontos saem da cozinha e caem aqui.</p>
      </div>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Prontos para sair</h2>
        {ready.length === 0 ? (
          <EmptyState title="Nada na fila" description="Quando a cozinha marcar pronto, o pedido aparece aqui." />
        ) : (
          ready.map((order) => (
            <article key={order.id} className="grid gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono font-semibold">#{order.publicCode}</p>
                <p className="text-sm">{formatBRL(order.totalCents)}</p>
              </div>
              <p className="text-sm">
                {order.customerName} · {order.customerPhone}
              </p>
              <p className="text-xs text-muted-foreground">{addressOf(order)}</p>
              <ul className="text-sm text-muted-foreground">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.name}
                  </li>
                ))}
              </ul>
              {drivers.length > 0 ? (
                <form action={assignDeliveryAction} className="flex gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="driverId" className="h-8 flex-1 rounded-lg border bg-background px-2 text-sm">
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Atribuir
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-muted-foreground">Cadastre um motoboy em Entregas para atribuir.</p>
              )}
              <form action={updateOrderStatusFormAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="toStatus" value="OUT_FOR_DELIVERY" />
                <Button type="submit" className="w-full">
                  Saiu para entrega
                </Button>
              </form>
            </article>
          ))
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Em rota</h2>
        {out.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrega em andamento.</p>
        ) : (
          out.map((order) => (
            <article key={order.id} className="grid gap-3 rounded-xl border bg-card p-4">
              <p className="font-semibold">
                #{order.publicCode} · {order.delivery?.driver?.name ?? "sem motoboy"}
              </p>
              <p className="text-sm">
                {order.customerName} · {addressOf(order)}
              </p>
              <form action={updateOrderStatusFormAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="toStatus" value="DELIVERED" />
                <Button type="submit" className="w-full">
                  Marcar entregue
                </Button>
              </form>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
