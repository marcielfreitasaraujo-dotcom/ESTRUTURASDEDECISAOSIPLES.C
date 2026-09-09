"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";

type Ticket = {
  id: string;
  publicCode: string;
  status: "CONFIRMED" | "PREPARING";
  elapsedMinutes: number;
  notes: string | null;
  items: { name: string; quantity: number; notes: string | null }[];
  totalCents: number;
};

export function KitchenBoard({ tickets }: { tickets: Ticket[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => {
        const minutes = ticket.elapsedMinutes;
        const late = minutes >= 30;
        return (
          <article
            key={ticket.id}
            className={`rounded-2xl border p-5 ${late ? "border-destructive bg-destructive/10" : "bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-2xl">#{ticket.publicCode}</h2>
              <span className="text-sm">{minutes} min</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {ticket.items.map((item) => (
                <li key={item.name}>
                  <strong>
                    {item.quantity}× {item.name}
                  </strong>
                  {item.notes ? <p className="text-muted-foreground">{item.notes}</p> : null}
                </li>
              ))}
            </ul>
            {ticket.notes ? <p className="mt-4 text-sm">Observação: {ticket.notes}</p> : null}
            <p className="mt-4 text-sm text-muted-foreground">{formatBRL(ticket.totalCents)}</p>
            <div className="mt-5 flex gap-2">
              {ticket.status === "CONFIRMED" ? (
                <Button
                  className="flex-1"
                  disabled={pending}
                  onClick={() =>
                    start(() => {
                      void updateOrderStatusAction(ticket.id, "PREPARING");
                    })
                  }
                >
                  Iniciar
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  disabled={pending}
                  onClick={() =>
                    start(() => {
                      void updateOrderStatusAction(ticket.id, "READY");
                    })
                  }
                >
                  Pronto
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
