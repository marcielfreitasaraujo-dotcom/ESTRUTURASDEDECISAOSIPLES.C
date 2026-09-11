import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listDeliveryOps } from "@/server/services/ops";
import { DeliveryQueueCard } from "@/components/delivery/queue-card";
import { EmptyState } from "@/components/empty-state";

export default async function EntregaPage() {
  const ctx = await requirePage(PERMISSIONS.DELIVERY_UPDATE);
  const { queue, drivers } = await listDeliveryOps(ctx.tenantId);
  const ready = queue.filter((order) => order.status === "READY");
  const out = queue.filter((order) => order.status === "OUT_FOR_DELIVERY");
  const driverOptions = drivers.map((driver) => ({ id: driver.id, name: driver.name }));

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-primary">Entrega</p>
        <h1 className="text-2xl font-semibold md:text-3xl">Fila do motoboy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Toque no pedido para ver o endereço e os itens.</p>
      </div>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Prontos para sair</h2>
        {ready.length === 0 ? (
          <EmptyState title="Nada na fila" description="Quando a cozinha marcar pronto, o pedido aparece aqui." />
        ) : (
          ready.map((order) => (
            <DeliveryQueueCard
              key={order.id}
              drivers={driverOptions}
              order={{
                id: order.id,
                publicCode: order.publicCode,
                totalCents: order.totalCents,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                street: order.street,
                addressNumber: order.addressNumber,
                neighborhood: order.neighborhood,
                city: order.city,
                status: "READY",
                items: order.items.map((item) => ({ id: item.id, quantity: item.quantity, name: item.name })),
                driverName: order.delivery?.driver?.name ?? null,
              }}
            />
          ))
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Em rota</h2>
        {out.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrega em andamento.</p>
        ) : (
          out.map((order) => (
            <DeliveryQueueCard
              key={order.id}
              drivers={driverOptions}
              order={{
                id: order.id,
                publicCode: order.publicCode,
                totalCents: order.totalCents,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                street: order.street,
                addressNumber: order.addressNumber,
                neighborhood: order.neighborhood,
                city: order.city,
                status: "OUT_FOR_DELIVERY",
                items: order.items.map((item) => ({ id: item.id, quantity: item.quantity, name: item.name })),
                driverName: order.delivery?.driver?.name ?? null,
              }}
            />
          ))
        )}
      </section>
    </div>
  );
}
