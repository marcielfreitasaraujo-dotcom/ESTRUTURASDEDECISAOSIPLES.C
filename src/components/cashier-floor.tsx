import Link from "next/link";
import type { FloorTable } from "@/domain/floor/tables";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

function Chair({ className }: { className: string }) {
  return <span aria-hidden className={cn("absolute rounded-sm bg-current opacity-40", className)} />;
}

export function CashierFloor({
  tables,
  selected,
  view,
}: {
  tables: FloorTable[];
  selected?: string;
  view?: "home" | "new-sale" | "open-table";
}) {
  const free = tables.filter((table) => table.status === "free").length;
  const busy = tables.length - free;

  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Mesas</h2>
          <p className="text-sm text-muted-foreground">Salão do PDV</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-muted-foreground/50" />
              Livre · {free}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary" />
              Ocupada · {busy}
            </li>
          </ul>
          <Link
            href="/caixa?venda=1"
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              view === "new-sale"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            Nova venda
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8">
        <Link
          href="/caixa"
          className={cn(
            "grid min-h-24 place-items-center rounded-xl border text-sm font-medium transition",
            selected || view === "new-sale"
              ? "border-border bg-muted/40 text-muted-foreground hover:border-primary/40"
              : "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          Balcão
        </Link>
        {tables.map((table) => {
          const active = selected === table.number;
          const occupied = table.status !== "free";
          return (
            <Link
              key={table.number}
              href={occupied ? `/caixa?mesa=${table.number}` : `/caixa?venda=1&mesa=${table.number}`}
              aria-label={`Mesa ${table.number}${occupied ? ", ocupada" : ", livre"}`}
              className={cn(
                "relative grid min-h-24 place-items-center rounded-xl border transition",
                occupied
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40",
                active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              <Chair className="left-1/2 top-1.5 h-1.5 w-5 -translate-x-1/2" />
              <Chair className="bottom-1.5 left-1/2 h-1.5 w-5 -translate-x-1/2" />
              <Chair className="left-1.5 top-1/2 h-5 w-1.5 -translate-y-1/2" />
              <Chair className="right-1.5 top-1/2 h-5 w-1.5 -translate-y-1/2" />
              <span className="grid size-14 place-items-center rounded-xl border border-current/30 bg-background/40 font-heading text-xl">
                {table.number}
              </span>
              {table.order ? (
                <span className="absolute bottom-1.5 text-[10px] text-current/80">
                  {table.status === "bill" ? "A receber" : formatBRL(table.order.totalCents)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
