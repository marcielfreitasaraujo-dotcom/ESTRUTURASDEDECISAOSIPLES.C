import { updateOrderEtaFormAction, updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatBRL } from "@/lib/money";
import { KANBAN_COLUMNS, type OrderStatus } from "@/domain/ordering/status";
import { delayToneLabel, nextStaffLabel, nextStaffStatus, type DelayTone } from "@/domain/ordering/tracking";
import type { FulfillmentType } from "@/domain/ordering/status";

type OrderCard = {
  id: string;
  publicCode: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  customerName: string;
  tableNumber?: string | null;
  totalCents: number;
  notes: string | null;
  estimatedMinutes: number;
  delayTone?: DelayTone;
  items: { id?: string; name: string; quantity: number }[];
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
              .map((order) => {
                const next = nextStaffStatus(order.status, order.fulfillment);
                const nextLabel = nextStaffLabel(order.status, order.fulfillment);
                return (
                <article key={order.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm">#{order.publicCode}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm">
                    {order.customerName}
                    {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.delayTone === "late"
                      ? `⚠️ ${delayToneLabel(order.delayTone)}`
                      : order.delayTone === "near"
                        ? `🟡 ${delayToneLabel(order.delayTone)}`
                        : `🟢 ${delayToneLabel(order.delayTone ?? "on_time")}`}
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
                  {order.status === "PENDING" ? (
                    <div className="mt-3 grid gap-2">
                      <form action={updateOrderStatusFormAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="toStatus" value="CONFIRMED" />
                        <Button className="w-full" size="sm" type="submit">
                          Confirmar
                        </Button>
                      </form>
                      <form action={updateOrderStatusFormAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="toStatus" value="CANCELLED" />
                        <input type="hidden" name="rejected" value="1" />
                        <input type="hidden" name="reason" value="O estabelecimento não conseguiu aceitar este pedido." />
                        <Button className="w-full" size="sm" type="submit" variant="outline">
                          Recusar
                        </Button>
                      </form>
                    </div>
                  ) : next ? (
                    <form action={updateOrderStatusFormAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="toStatus" value={next} />
                      <Button className="mt-3 w-full" size="sm" type="submit">
                        {nextLabel}
                      </Button>
                    </form>
                  ) : null}
                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" ? (
                    <form action={updateOrderEtaFormAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="reason" value="Volume de pedidos" />
                      <input
                        name="minutes"
                        type="number"
                        min={5}
                        defaultValue={order.estimatedMinutes + 10}
                        className="h-8 w-16 rounded border bg-background px-2 text-xs"
                        aria-label="Novo tempo em minutos"
                      />
                      <Button size="sm" type="submit" variant="ghost">
                        Tempo
                      </Button>
                    </form>
                  ) : null}
                </article>
                );
              })}
          </div>
        </section>
      ))}
      </div>
    </div>
  );
}
