import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getKitchenQueue } from "@/server/services/orders";
import { KitchenBoard } from "@/components/kitchen-board";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ds/page-header";

export default async function KitchenPage() {
  const ctx = await requirePage(PERMISSIONS.KITCHEN_READ);
  const tickets = await getKitchenQueue(ctx.tenantId);

  return (
    <div className="grid gap-6">
      <PageHeader title="Cozinha" description="Tela pensada para tablet. Pedidos com mais de 30 minutos ficam em destaque." />
      {tickets.length === 0 ? (
        <EmptyState title="Fila vazia" description="Quando um pedido for confirmado, ele aparece aqui com timer e botões grandes." />
      ) : (
        <KitchenBoard
          tickets={tickets.map((ticket) => ({
            id: ticket.id,
            publicCode: ticket.publicCode,
            tableNumber: ticket.tableNumber,
            status: ticket.status as "CONFIRMED" | "PREPARING",
            elapsedMinutes: ticket.elapsedMinutes,
            notes: ticket.notes,
            items: ticket.items,
            totalCents: ticket.totalCents,
          }))}
        />
      )}
    </div>
  );
}
