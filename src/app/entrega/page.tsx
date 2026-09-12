import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listDeliveryOps } from "@/server/services/ops";
import { DeliveryQueueCard } from "@/components/delivery/queue-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, SurfaceHeader, StatCard } from "@/components/ds/surface";

export default async function EntregaPage() {
  const ctx = await requirePage(PERMISSIONS.DELIVERY_UPDATE);
  const { queue, drivers } = await listDeliveryOps(ctx.tenantId);
  const ready = queue.filter((order) => order.status === "READY");
  const out = queue.filter((order) => order.status === "OUT_FOR_DELIVERY");
  const driverOptions = drivers.map((driver) => ({ id: driver.id, name: driver.name }));

  return (
    <PageStack>
      <PageHeader
        title="Fila do motoboy"
        description="Toque no pedido para ver o endereço e os itens."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Prontos para sair" value={String(ready.length)} tone="warning" />
        <StatCard label="Em rota" value={String(out.length)} tone="info" />
        <StatCard label="Motoboys" value={String(drivers.length)} />
      </div>
      <Surface>
        <SurfaceHeader title="Prontos para sair" description="A cozinha marcou estes pedidos como prontos." />
        {ready.length === 0 ? (
          <EmptyState title="Nada na fila" description="Quando a cozinha marcar pronto, o pedido aparece aqui." />
        ) : (
          <div className="grid gap-3">
            {ready.map((order) => (
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
            ))}
          </div>
        )}
      </Surface>
      <Surface>
        <SurfaceHeader title="Em rota" description="Pedidos que já saíram para entrega." />
        {out.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrega em andamento.</p>
        ) : (
          <div className="grid gap-3">
            {out.map((order) => (
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
            ))}
          </div>
        )}
      </Surface>
    </PageStack>
  );
}
