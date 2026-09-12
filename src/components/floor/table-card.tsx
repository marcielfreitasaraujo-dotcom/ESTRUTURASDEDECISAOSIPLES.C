"use client";

import type { FloorTableSnapshot } from "@/domain/floor/snapshot";
import { TABLE_STATUS_LABEL } from "@/domain/floor/status";
import { occupancyAlertLevel } from "@/domain/floor/occupancy";
import { OccupancyTimer } from "@/components/floor/occupancy-timer";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

const CARD: Record<FloorTableSnapshot["status"], string> = {
  FREE: "border-emerald-400/45 bg-emerald-500/12 text-emerald-50 hover:border-emerald-300",
  OCCUPIED: "border-red-400/50 bg-red-500/18 text-red-50 hover:border-red-300",
  RESERVED: "border-amber-400/50 bg-amber-400/18 text-amber-50 hover:border-amber-300",
  BLOCKED: "border-zinc-600 bg-muted/90 text-muted-foreground hover:border-zinc-500",
};

function reservationClock(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function TableCard({
  table,
  selected,
  onSelect,
}: {
  table: FloorTableSnapshot;
  selected?: boolean;
  onSelect: (table: FloorTableSnapshot) => void;
}) {
  const alert = table.status === "OCCUPIED" && table.openedAt ? occupancyAlertLevel(table.openedAt) : "none";
  const customer = table.customerName || table.order?.customerName;
  const total = table.order?.totalCents ?? 0;
  const statusLabel = TABLE_STATUS_LABEL[table.status];
  const extraLabel =
    table.status === "OCCUPIED" && customer
      ? `, ${customer}`
      : table.status === "RESERVED" && table.reservationName
        ? `, ${table.reservationName}`
        : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(table)}
      data-table-number={table.number}
      data-table-status={table.status}
      aria-label={`Mesa ${table.number}, ${statusLabel}${extraLabel}`}
      className={cn(
        "flex min-h-36 flex-col rounded-2xl border p-3 text-left shadow-sm transition duration-200 ease-out",
        CARD[table.status],
        selected && "ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-950",
        alert === "warn" && "ring-1 ring-amber-300/80",
        alert === "alert" && "ring-2 ring-red-300 animate-pulse",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-lg tracking-wide">Mesa {table.number}</p>
        <span className="rounded-full border border-current/25 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
          {statusLabel}
        </span>
      </div>
      {table.status === "OCCUPIED" ? (
        <div className="mt-auto grid gap-0.5 pt-3 text-sm">
          <p className="truncate font-medium">{customer || "Cliente"}</p>
          {table.openedAt ? <OccupancyTimer openedAt={table.openedAt} className="text-current/80" /> : null}
          {total > 0 ? <p className="font-semibold">{formatBRL(total)}</p> : <p className="text-current/70">Sem itens</p>}
          {table.partySize ? <p className="text-xs text-current/70">{table.partySize} pessoas</p> : null}
          {table.waiterName ? <p className="truncate text-xs text-current/70">{table.waiterName}</p> : null}
          {table.joinedNumbers.length > 0 ? (
            <p className="text-xs text-current/70">Juntas: {table.joinedNumbers.join(", ")}</p>
          ) : null}
        </div>
      ) : null}
      {table.status === "RESERVED" ? (
        <div className="mt-auto grid gap-0.5 pt-3 text-sm">
          <p className="truncate font-medium">{table.reservationName}</p>
          <p>{reservationClock(table.reservedAt)}</p>
          {table.reservationPeople ? <p className="text-xs">{table.reservationPeople} pessoas</p> : null}
        </div>
      ) : null}
      {table.status === "FREE" ? <p className="mt-auto pt-6 text-sm text-current/80">Pronta para uso</p> : null}
      {table.status === "BLOCKED" ? <p className="mt-auto pt-6 text-sm">Fora de operação</p> : null}
    </button>
  );
}
