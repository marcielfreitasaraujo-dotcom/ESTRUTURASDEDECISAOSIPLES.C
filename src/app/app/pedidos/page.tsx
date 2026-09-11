import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listOrdersByStatus } from "@/server/services/orders";
import { OrdersKanban } from "@/components/orders-kanban";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const ctx = await requirePage(PERMISSIONS.ORDER_READ);
  if (ctx.tenantRole === "CASHIER") redirect("/caixa/pedidos");
  const orders = await listOrdersByStatus(ctx.tenantId);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Atualize o status com um toque. Cada mudança fica no histórico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/garcom">Novo pedido</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/salao">Mesas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/cozinha">Cozinha</Link>
          </Button>
        </div>
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Nenhum pedido aberto" description="Os pedidos do cardápio público aparecem aqui em tempo quase real após o checkout." />
      ) : (
        <OrdersKanban
          orders={orders.map((order) => ({
            id: order.id,
            publicCode: order.publicCode,
            status: order.status,
            customerName: order.customerName,
            tableNumber: order.tableNumber,
            totalCents: order.totalCents,
            notes: order.notes,
            items: order.items,
          }))}
        />
      )}
    </div>
  );
}
