"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { assignDeliveryAction } from "@/app/actions/ops";
import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { nativeSelectClass } from "@/lib/field";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export type DeliveryQueueOrder = {
  id: string;
  publicCode: string;
  totalCents: number;
  customerName: string;
  customerPhone: string;
  street: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  status: "READY" | "OUT_FOR_DELIVERY";
  items: { id: string; quantity: number; name: string }[];
  driverName: string | null;
};

function addressOf(order: DeliveryQueueOrder) {
  return [order.street, order.addressNumber, order.neighborhood, order.city].filter(Boolean).join(", ") || "Sem endereço";
}

export function DeliveryQueueCard({
  order,
  drivers,
}: {
  order: DeliveryQueueOrder;
  drivers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ready = order.status === "READY";

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        className="flex w-full min-w-0 items-start gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono font-semibold">#{order.publicCode}</p>
            <p className="shrink-0 text-sm">{formatBRL(order.totalCents)}</p>
          </div>
          <p className="mt-1 truncate text-sm">
            {order.customerName}
            {order.neighborhood ? ` · ${order.neighborhood}` : ""}
          </p>
          {!ready && order.driverName ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{order.driverName}</p>
          ) : null}
        </div>
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="grid gap-3 border-t px-4 py-3">
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
          {ready && drivers.length > 0 ? (
            <form action={assignDeliveryAction} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="driverId" className={nativeSelectClass} aria-label="Motoboy">
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" className="min-h-11">
                Atribuir
              </Button>
            </form>
          ) : null}
          {ready && drivers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Cadastre um motoboy em Entregas para atribuir.</p>
          ) : null}
          <form action={updateOrderStatusFormAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="toStatus" value={ready ? "OUT_FOR_DELIVERY" : "DELIVERED"} />
            <Button type="submit" className="min-h-11 w-full">
              {ready ? "Saiu para entrega" : "Marcar entregue"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="border-t px-4 py-3">
          <form action={updateOrderStatusFormAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="toStatus" value={ready ? "OUT_FOR_DELIVERY" : "DELIVERED"} />
            <Button type="submit" className="min-h-11 w-full">
              {ready ? "Saiu para entrega" : "Marcar entregue"}
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}
