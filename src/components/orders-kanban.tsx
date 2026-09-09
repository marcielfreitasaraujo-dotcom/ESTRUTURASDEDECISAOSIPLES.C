"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatBRL } from "@/lib/money";
import { KANBAN_COLUMNS, type OrderStatus } from "@/domain/ordering/status";

type OrderCard = {
  id: string;
  publicCode: string;
  status: OrderStatus;
  customerName: string;
  totalCents: number;
  notes: string | null;
  items: { name: string; quantity: number }[];
};

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export function OrdersKanban({ orders }: { orders: OrderCard[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {KANBAN_COLUMNS.map((column) => (
        <section key={column.key} className="rounded-xl bg-muted/40 p-3">
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
                  <p className="mt-2 text-sm">{order.customerName}</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {order.items.map((item) => (
                      <li key={item.name}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.notes ? <p className="mt-2 text-xs">Obs.: {order.notes}</p> : null}
                  <p className="mt-2 text-sm font-medium">{formatBRL(order.totalCents)}</p>
                  {NEXT[order.status] ? (
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(() => {
                          void updateOrderStatusAction(order.id, NEXT[order.status]!);
                        })
                      }
                    >
                      Avançar
                    </Button>
                  ) : null}
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
