import { updateOrderStatusFormAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { StatusPill } from "@/components/ds/data-table";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  publicCode: string;
  tableNumber?: string | null;
  status: "CONFIRMED" | "PREPARING";
  elapsedMinutes: number;
  notes: string | null;
  items: { name: string; quantity: number; notes: string | null }[];
  totalCents: number;
};

export function KitchenBoard({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => {
        const minutes = ticket.elapsedMinutes;
        const late = minutes >= 30;
        const nextStatus = ticket.status === "CONFIRMED" ? "PREPARING" : "READY";
        return (
          <article
            key={ticket.id}
            className={cn(
              "rounded-xl border p-5",
              late ? "border-destructive bg-destructive/10" : "border-border bg-card",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-mono text-2xl">#{ticket.publicCode}</h2>
              <StatusPill tone={late ? "danger" : ticket.status === "PREPARING" ? "warning" : "info"}>
                {minutes} min
              </StatusPill>
            </div>
            {ticket.tableNumber ? <p className="mt-1 text-sm text-primary">Mesa {ticket.tableNumber}</p> : null}
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
            <form action={updateOrderStatusFormAction} method="post" className="mt-5">
              <input type="hidden" name="orderId" value={ticket.id} />
              <input type="hidden" name="toStatus" value={nextStatus} />
              <Button className="w-full" type="submit">
                {ticket.status === "CONFIRMED" ? "Iniciar" : "Pronto"}
              </Button>
            </form>
          </article>
        );
      })}
    </div>
  );
}
