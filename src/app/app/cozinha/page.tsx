import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { getKitchenQueue } from "@/server/services/orders";
import { KitchenBoard } from "@/components/kitchen-board";
import { LiveRefresh } from "@/components/live-refresh";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";

export default async function KitchenPage() {
  const ctx = await requirePage(PERMISSIONS.KITCHEN_READ);
  const tickets = await getKitchenQueue(ctx.tenantId);

  return (
    <PageStack>
      <PageHeader title="Cozinha" description="Pedidos atrasados ou no limite aparecem com texto e ícone, não só cor." />
      <LiveRefresh />
      {tickets.length === 0 ? (
        <Surface>
          <EmptyState title="Fila vazia" description="Quando um pedido for confirmado, ele aparece aqui com timer e botões grandes." />
        </Surface>
      ) : (
        <KitchenBoard
          tickets={tickets.map((ticket) => ({
            id: ticket.id,
            publicCode: ticket.publicCode,
            tableNumber: ticket.tableNumber,
            status: ticket.status as "CONFIRMED" | "PREPARING",
            elapsedMinutes: ticket.elapsedMinutes,
            estimatedMinutes: ticket.estimatedMinutes,
            delayTone: ticket.delayTone,
            notes: ticket.notes,
            items: ticket.items,
            totalCents: ticket.totalCents,
          }))}
        />
      )}
    </PageStack>
  );
}
