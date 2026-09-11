import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatBRL } from "@/lib/money";
import { KANBAN_COLUMNS, type OrderStatus } from "@/domain/ordering/status";

type OrderCard = {
  id: string;
  publicCode: string;
  status: OrderStatus;
  customerName: string;
  tableNumber?: string | null;
  totalCents: number;
  notes: string | null;
  items: { id?: string; name: string; quantity: number }[];
};

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export function OrdersKanban({ orders }: { orders: OrderCard[] }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto pb-2 snap-x snap-mandatory md:overflow-visible md:pb-0">
      <div className="flex w-max min-w-full gap-3 px-0.5 md:grid md:w-full md:grid-cols-3 xl:grid-cols-6">
      {KANBAN_COLUMNS.map((column) => (
        <section key={column.key} className="w-[16.5rem] shrink-0 snap-start rounded-xl bg-muted/40 p-3 md:w-auto">
          <h2 className="mb-3 text-sm font-medium">{column.title}</h2>
          <div className="grid gap-3">
            {orders
              .filter((order) => order.status === column.key)
              .map((order) => (
                <article key={order.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm">#{order.publicCode}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm">
                    {order.customerName}
                    {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {order.items.map((item, index) => (
                      <li key={item.id ?? `${item.name}-${index}`}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.notes ? <p className="mt-2 text-xs">Obs.: {order.notes}</p> : null}
                  <p className="mt-2 text-sm font-medium">{formatBRL(order.totalCents)}</p>
                  {NEXT[order.status] ? (
                    <form action={updateOrderStatusFormAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="toStatus" value={NEXT[order.status]} />
                      <Button className="mt-3 w-full" size="sm" type="submit">
                        Avançar
                      </Button>
                    </form>
                  ) : null}
                </article>
              ))}
          </div>
        </section>
      ))}
      </div>
    </div>
  );
}
