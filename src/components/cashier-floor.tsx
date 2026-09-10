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
}: {
  tables: FloorTable[];
  selected?: string;
}) {
  const free = tables.filter((table) => table.status === "free").length;
  const busy = tables.length - free;

  return (
    <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-orange-400">Salão</p>
          <h2 className="font-heading text-2xl">Mesas</h2>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs text-zinc-400">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-zinc-600" />
            Livre · {free}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-orange-500" />
            Ocupada · {busy}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-orange-300" />
            A receber
          </li>
        </ul>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8">
        <Link
          href="/caixa"
          className={cn(
            "grid min-h-24 place-items-center rounded-2xl border text-sm font-medium transition",
            selected
              ? "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
              : "border-orange-500/40 bg-orange-500/10 text-orange-200",
          )}
        >
          Balcão
        </Link>
        {tables.map((table) => {
          const active = selected === table.number;
          const occupied = table.status !== "free";
          const bill = table.status === "bill";
          return (
            <Link
              key={table.number}
              href={`/caixa?mesa=${table.number}`}
              aria-label={`Mesa ${table.number}${occupied ? ", ocupada" : ", livre"}`}
              className={cn(
                "relative grid min-h-24 place-items-center rounded-2xl border transition",
                occupied
                  ? bill
                    ? "border-orange-300 bg-orange-500/35 text-orange-100"
                    : "border-orange-500 bg-orange-500/20 text-orange-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600",
                occupied && "shadow-[0_0_22px_rgba(249,115,22,0.22)]",
                active && "ring-2 ring-orange-200 ring-offset-2 ring-offset-zinc-950",
              )}
            >
              <Chair className="left-1/2 top-1.5 h-1.5 w-5 -translate-x-1/2" />
              <Chair className="bottom-1.5 left-1/2 h-1.5 w-5 -translate-x-1/2" />
              <Chair className="left-1.5 top-1/2 h-5 w-1.5 -translate-y-1/2" />
              <Chair className="right-1.5 top-1/2 h-5 w-1.5 -translate-y-1/2" />
              <span className="grid size-14 place-items-center rounded-2xl border border-current/30 bg-black/25 font-heading text-xl">
                {table.number}
              </span>
              {table.order ? (
                <span className="absolute bottom-1.5 text-[10px] text-current/80">
                  {bill ? "A receber" : formatBRL(table.order.totalCents)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
