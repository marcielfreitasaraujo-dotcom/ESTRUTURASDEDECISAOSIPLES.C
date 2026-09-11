"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FloorSnapshot, FloorTableSnapshot, FloorWaiterOption } from "@/domain/floor/snapshot";
import { TABLE_STATUS_LABEL, actionsForTableStatus } from "@/domain/floor/status";
import { OccupancyTimer } from "@/components/floor/occupancy-timer";
import { TableCard } from "@/components/floor/table-card";
import { StaffOrderForm } from "@/components/staff-order-form";
import {
  blockSalonTableAction,
  cancelReservationAction,
  closeSalonTableAction,
  joinSalonTablesAction,
  occupyReservationAction,
  openSalonTableAction,
  reserveSalonTableAction,
  splitSalonTableAction,
  transferSalonTableAction,
  updateSalonTableGuestAction,
  vacateSalonTableAction,
} from "@/app/actions/floor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/money";

type Catalog = {
  products: { id: string; name: string; priceCents: number; promotionalPriceCents: number | null; kind: string; active?: boolean }[];
  sizes: { id: string; name: string; maxFlavors: number }[];
  flavors: { id: string; name: string; active?: boolean }[];
  crusts: { id: string; name: string; priceCents: number }[];
};

type DialogKind =
  | "open"
  | "reserve"
  | "occupied"
  | "add"
  | "guest"
  | "transfer"
  | "join"
  | "split"
  | "counter"
  | "vacate";

const ACTION_LABEL: Record<string, string> = {
  open: "Abrir mesa",
  view: "Ver comanda",
  add: "Adicionar itens",
  rename: "Alterar cliente",
  transfer: "Transferir mesa",
  join: "Juntar mesas",
  split: "Dividir comanda",
  reserve: "Reservar",
  block: "Bloquear",
  close: "Fechar mesa",
  vacate: "Desocupar mesa",
  "occupy-reservation": "Ocupar mesa",
  "edit-reservation": "Editar reserva",
  "cancel-reservation": "Cancelar reserva",
  unblock: "Liberar mesa",
};

export function FloorMap({
  initial,
  catalog,
  waiters,
  canSettle,
  orderFeedback,
}: {
  initial: FloorSnapshot;
  catalog: Catalog;
  waiters: FloorWaiterOption[];
  canSettle: boolean;
  orderFeedback?: { error?: string; ok?: string };
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [sectorId, setSectorId] = useState(initial.sectors[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const reload = useCallback(async () => {
    const response = await fetch("/api/caixa/mapa", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as FloorSnapshot;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    if (dialog) return;
    const timer = window.setInterval(() => {
      void reload();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [reload, dialog]);

  useEffect(() => {
    if (orderFeedback?.error) toast.error(orderFeedback.error);
    if (orderFeedback?.ok) toast.success(orderFeedback.ok === "quitada" ? "Mesa fechada." : `Comanda #${orderFeedback.ok}`);
  }, [orderFeedback?.error, orderFeedback?.ok]);

  const selected = snapshot.tables.find((table) => table.id === selectedId) ?? null;
  const freeTables = snapshot.tables.filter((table) => table.status === "FREE");

  const visible = useMemo(() => {
    return snapshot.tables.filter((table) => {
      if (sectorId && table.sectorId !== sectorId) return false;
      if (statusFilter !== "ALL" && table.status !== statusFilter) return false;
      const haystack = `${table.number} ${table.customerName ?? ""} ${table.reservationName ?? ""} ${table.waiterName ?? ""}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [snapshot.tables, sectorId, statusFilter, query]);

  function openDialog(kind: DialogKind, table?: FloorTableSnapshot) {
    if (table) setSelectedId(table.id);
    setDialog(kind);
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível concluir.");
        return;
      }
      toast.success(success);
      setDialog(null);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function onQuickAction(action: string, table: FloorTableSnapshot) {
    setSelectedId(table.id);
    if (action === "open") return openDialog("open", table);
    if (action === "view") return openDialog("occupied", table);
    if (action === "add") return openDialog("add", table);
    if (action === "rename") return openDialog("guest", table);
    if (action === "transfer") return openDialog("transfer", table);
    if (action === "join") return openDialog("join", table);
    if (action === "split") return openDialog("split", table);
    if (action === "reserve" || action === "edit-reservation") return openDialog("reserve", table);
    if (action === "block") return run(() => blockSalonTableAction(table.id, true), "Mesa bloqueada.");
    if (action === "unblock") return run(() => blockSalonTableAction(table.id, false), "Mesa liberada.");
    if (action === "close") {
      if (table.order?.id) {
        router.push(`/caixa/pagamentos?pedido=${table.order.id}`);
        return;
      }
      return run(() => closeSalonTableAction(table.id), "Mesa fechada.");
    }
    if (action === "vacate") return openDialog("vacate", table);
    if (action === "occupy-reservation") return run(() => occupyReservationAction(table.id), "Mesa ocupada.");
    if (action === "cancel-reservation") return run(() => cancelReservationAction(table.id), "Reserva cancelada.");
  }

  return (
    <div className="grid gap-5">
      <header className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Atendimento</p>
            <h1 className="font-heading text-3xl">Mapa de Mesas</h1>
            <p className="mt-1 text-sm text-zinc-400">Total: {snapshot.counts.total} mesas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" className="h-11" onClick={() => openDialog("open", freeTables[0])}>
              Abrir mesa
            </Button>
            <Button type="button" size="lg" variant="outline" className="h-11" onClick={() => openDialog("reserve", freeTables[0])}>
              Nova reserva
            </Button>
            <Button type="button" size="lg" variant="outline" className="h-11" onClick={() => openDialog("counter")}>
              Balcão
            </Button>
            <Button type="button" size="lg" variant="ghost" className="h-11" onClick={() => void reload()}>
              Atualizar
            </Button>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
            Livres: {snapshot.counts.free}
          </li>
          <li className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-red-100">
            Ocupadas: {snapshot.counts.occupied}
          </li>
          <li className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-100">
            Reservadas: {snapshot.counts.reserved}
          </li>
          <li className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-zinc-300">
            Indisponíveis: {snapshot.counts.blocked}
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          {snapshot.sectors.map((sector) => (
            <Button
              key={sector.id}
              type="button"
              size="lg"
              variant={sectorId === sector.id ? "default" : "outline"}
              className="h-11"
              onClick={() => setSectorId(sector.id)}
            >
              {sector.name}
            </Button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar mesa, cliente ou garçom"
            className="h-12"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-lg border bg-background px-3"
          >
            <option value="ALL">Todos os status</option>
            <option value="FREE">Livres</option>
            <option value="OCCUPIED">Ocupadas</option>
            <option value="RESERVED">Reservadas</option>
            <option value="BLOCKED">Indisponíveis</option>
          </select>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {visible.map((table) => (
          <div key={table.id} className="relative">
            <TableCard
              table={table}
              selected={selectedId === table.id}
              onSelect={(item) => {
                setSelectedId(item.id);
                if (item.status === "FREE") openDialog("open", item);
                else if (item.status === "OCCUPIED") openDialog("occupied", item);
                else if (item.status === "RESERVED") openDialog("reserve", item);
              }}
            />
            <div className="absolute right-2 top-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="icon-sm" variant="ghost" className="h-8 w-8 bg-black/20 text-current" aria-label={`Ações da mesa ${table.number}`}>
                    ···
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actionsForTableStatus(table.status)
                    .filter((action) => (action === "close" || action === "vacate" ? canSettle : true))
                    .map((action) => (
                      <DropdownMenuItem key={action} onClick={() => void onQuickAction(action, table)}>
                        {ACTION_LABEL[action]}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </section>
      {visible.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma mesa neste filtro.</p> : null}

      <OpenTableDialog
        open={dialog === "open"}
        tables={freeTables}
        selected={selected}
        waiters={waiters}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "open" : null)}
        onSubmit={(payload) => run(() => openSalonTableAction(payload), "Mesa ocupada.")}
      />
      <ReserveDialog
        open={dialog === "reserve"}
        tables={snapshot.tables.filter((table) => table.status === "FREE" || table.status === "RESERVED")}
        selected={selected}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "reserve" : null)}
        onSubmit={(payload) => run(() => reserveSalonTableAction(payload), "Reserva registrada.")}
        onOccupy={() => (selected ? run(() => occupyReservationAction(selected.id), "Mesa ocupada.") : Promise.resolve())}
        onCancelReservation={() =>
          selected ? run(() => cancelReservationAction(selected.id), "Reserva cancelada.") : Promise.resolve()
        }
      />
      <OccupiedDialog
        open={dialog === "occupied"}
        table={selected}
        canSettle={canSettle}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "occupied" : null)}
        onAdd={() => setDialog("add")}
        onClose={() => {
          if (selected?.order?.id) {
            router.push(`/caixa/pagamentos?pedido=${selected.order.id}`);
            return;
          }
          if (selected) void run(() => closeSalonTableAction(selected.id), "Mesa fechada.");
        }}
        onVacate={() => setDialog("vacate")}
        onTransfer={() => setDialog("transfer")}
        onJoin={() => setDialog("join")}
        onSplit={() => setDialog("split")}
        onGuest={() => setDialog("guest")}
      />
      <Dialog open={dialog === "add"} onOpenChange={(open) => setDialog(open ? "add" : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar itens {selected ? `· Mesa ${selected.number}` : ""}</DialogTitle>
            <DialogDescription>O lançamento entra na comanda aberta desta mesa.</DialogDescription>
          </DialogHeader>
          {selected ? (
            <StaffOrderForm
              mode="cashier"
              saleMode="add"
              tableNumber={selected.number}
              products={catalog.products}
              sizes={catalog.sizes}
              flavors={catalog.flavors}
              crusts={catalog.crusts}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={dialog === "counter"} onOpenChange={(open) => setDialog(open ? "counter" : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Venda no balcão</DialogTitle>
            <DialogDescription>Pedido sem ocupar mesa do salão.</DialogDescription>
          </DialogHeader>
          <StaffOrderForm
            mode="cashier"
            saleMode="counter"
            products={catalog.products}
            sizes={catalog.sizes}
            flavors={catalog.flavors}
            crusts={catalog.crusts}
          />
        </DialogContent>
      </Dialog>
      <GuestDialog
        open={dialog === "guest"}
        table={selected}
        waiters={waiters}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "guest" : null)}
        onSubmit={(payload) => run(() => updateSalonTableGuestAction(payload), "Cliente atualizado.")}
      />
      <PickTableDialog
        open={dialog === "transfer"}
        title="Transferir mesa"
        description="A comanda passa para a mesa livre escolhida."
        tables={freeTables}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "transfer" : null)}
        onSubmit={(destinationTableId) =>
          selected ? run(() => transferSalonTableAction(selected.id, destinationTableId), "Mesa transferida.") : Promise.resolve()
        }
      />
      <PickTableDialog
        open={dialog === "join"}
        title="Juntar mesas"
        description="A mesa livre fica ligada a esta comanda."
        tables={freeTables.filter((table) => table.id !== selected?.id)}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "join" : null)}
        onSubmit={(destinationTableId) =>
          selected ? run(() => joinSalonTablesAction(selected.id, destinationTableId), "Mesas juntas.") : Promise.resolve()
        }
      />
      <SplitDialog
        open={dialog === "split"}
        table={selected}
        freeTables={freeTables}
        busy={busy}
        onOpenChange={(open) => setDialog(open ? "split" : null)}
        onSubmit={(payload) => run(() => splitSalonTableAction(payload), "Comanda dividida.")}
      />
      <Dialog open={dialog === "vacate"} onOpenChange={(open) => setDialog(open ? "vacate" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desocupar mesa {selected?.number}?</DialogTitle>
            <DialogDescription>
              A comanda aberta será cancelada e o histórico da venda permanece. A mesa volta a ficar livre.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || !selected}
              onClick={() => selected && run(() => vacateSalonTableAction(selected.id), "Mesa desocupada.")}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OpenTableDialog({
  open,
  tables,
  selected,
  waiters,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  tables: FloorTableSnapshot[];
  selected: FloorTableSnapshot | null;
  waiters: FloorWaiterOption[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { tableId: string; customerName: string; partySize?: number; waiterId?: string }) => Promise<void>;
}) {
  const [tableId, setTableId] = useState(selected?.id ?? "");
  const [customerName, setCustomerName] = useState(selected?.customerName ?? "");
  const [partySize, setPartySize] = useState("2");
  const [waiterId, setWaiterId] = useState("");
  useEffect(() => {
    if (!open) return;
    setTableId(selected?.id ?? tables[0]?.id ?? "");
    setCustomerName(selected?.customerName ?? "");
    setPartySize("2");
    setWaiterId("");
  }, [open, selected?.id, tables]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir mesa</DialogTitle>
          <DialogDescription>A mesa passa a ocupada e o cronômetro começa agora.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({
              tableId,
              customerName,
              partySize: Number(partySize) || undefined,
              waiterId: waiterId || undefined,
            });
          }}
        >
          <Label htmlFor="open-table">Mesa</Label>
          <select id="open-table" className="h-12 rounded-lg border bg-background px-3" value={tableId} onChange={(event) => setTableId(event.target.value)}>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Mesa {table.number} · {table.sectorName}
              </option>
            ))}
          </select>
          <Label htmlFor="open-name">Cliente</Label>
          <Input id="open-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="h-12" required />
          <Label htmlFor="open-people">Pessoas</Label>
          <Input id="open-people" type="number" min={1} value={partySize} onChange={(event) => setPartySize(event.target.value)} className="h-12" />
          <Label htmlFor="open-waiter">Garçom</Label>
          <select id="open-waiter" className="h-12 rounded-lg border bg-background px-3" value={waiterId} onChange={(event) => setWaiterId(event.target.value)}>
            <option value="">Sem responsável</option>
            {waiters.map((waiter) => (
              <option key={waiter.id} value={waiter.id}>
                {waiter.name}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button type="submit" size="lg" className="h-12" disabled={busy || !tableId || !customerName.trim()}>
              Criar comanda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReserveDialog({
  open,
  tables,
  selected,
  busy,
  onOpenChange,
  onSubmit,
  onOccupy,
  onCancelReservation,
}: {
  open: boolean;
  tables: FloorTableSnapshot[];
  selected: FloorTableSnapshot | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    tableId: string;
    reservationName: string;
    reservedAt: string;
    reservationPeople?: number;
    reservationNotes?: string;
  }) => Promise<void>;
  onOccupy: () => Promise<void>;
  onCancelReservation: () => Promise<void>;
}) {
  const [tableId, setTableId] = useState(selected?.id ?? "");
  const [name, setName] = useState(selected?.reservationName ?? "");
  const [when, setWhen] = useState("");
  const [people, setPeople] = useState(selected?.reservationPeople ? String(selected.reservationPeople) : "2");
  const [notes, setNotes] = useState(selected?.reservationNotes ?? "");
  useEffect(() => {
    if (!open) return;
    setTableId(selected?.id ?? tables[0]?.id ?? "");
    setName(selected?.reservationName ?? "");
    setNotes(selected?.reservationNotes ?? "");
    setPeople(selected?.reservationPeople ? String(selected.reservationPeople) : "2");
    if (selected?.reservedAt) {
      const date = new Date(selected.reservedAt);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setWhen(local);
    } else {
      const soon = new Date();
      soon.setHours(soon.getHours() + 2, 0, 0, 0);
      const local = new Date(soon.getTime() - soon.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setWhen(local);
    }
  }, [open, selected?.id]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selected?.status === "RESERVED" ? `Reserva da mesa ${selected.number}` : "Nova reserva"}</DialogTitle>
          <DialogDescription>A mesa fica amarela até o cliente chegar.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({
              tableId,
              reservationName: name,
              reservedAt: when,
              reservationPeople: Number(people) || undefined,
              reservationNotes: notes || undefined,
            });
          }}
        >
          <Label htmlFor="res-table">Mesa</Label>
          <select id="res-table" className="h-12 rounded-lg border bg-background px-3" value={tableId} onChange={(event) => setTableId(event.target.value)}>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Mesa {table.number}
              </option>
            ))}
          </select>
          <Label htmlFor="res-name">Cliente</Label>
          <Input id="res-name" value={name} onChange={(event) => setName(event.target.value)} className="h-12" required />
          <Label htmlFor="res-when">Horário</Label>
          <Input id="res-when" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="h-12" />
          <Label htmlFor="res-people">Pessoas</Label>
          <Input id="res-people" type="number" min={1} value={people} onChange={(event) => setPeople(event.target.value)} className="h-12" />
          <Label htmlFor="res-notes">Observações</Label>
          <Input id="res-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="h-12" />
          {selected?.status === "RESERVED" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" disabled={busy} onClick={() => void onOccupy()}>
                Ocupar mesa
              </Button>
              <Button type="button" variant="destructive" disabled={busy} onClick={() => void onCancelReservation()}>
                Cancelar reserva
              </Button>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" size="lg" className="h-12" disabled={busy || !tableId}>
              Salvar reserva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OccupiedDialog({
  open,
  table,
  canSettle,
  busy,
  onOpenChange,
  onAdd,
  onClose,
  onVacate,
  onTransfer,
  onJoin,
  onSplit,
  onGuest,
}: {
  open: boolean;
  table: FloorTableSnapshot | null;
  canSettle: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  onClose: () => void;
  onVacate: () => void;
  onTransfer: () => void;
  onJoin: () => void;
  onSplit: () => void;
  onGuest: () => void;
}) {
  if (!table) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Mesa {table.number} · {TABLE_STATUS_LABEL[table.status]}
          </DialogTitle>
          <DialogDescription>
            {table.customerName || table.order?.customerName || "Sem cliente"}
            {table.waiterName ? ` · ${table.waiterName}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {table.openedAt ? (
            <p className="text-2xl font-heading">
              <OccupancyTimer openedAt={table.openedAt} />
            </p>
          ) : null}
          <p className="text-lg font-semibold">{table.order ? formatBRL(table.order.totalCents) : "R$ 0,00"}</p>
          {table.order ? <p className="text-sm text-muted-foreground">Comanda #{table.order.publicCode}</p> : null}
          {table.partySize ? <p className="text-sm text-muted-foreground">{table.partySize} pessoas</p> : null}
          {table.order ? (
            <ul className="grid max-h-48 gap-1 overflow-y-auto text-sm">
              {table.order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span>{formatBRL(item.totalCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum item lançado ainda.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" className="h-11" onClick={onAdd}>
              Abrir comanda
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onAdd}>
              Adicionar itens
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onGuest}>
              Alterar cliente
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onTransfer}>
              Transferir
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onJoin}>
              Juntar mesas
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onSplit}>
              Dividir comanda
            </Button>
            {canSettle ? (
              <Button type="button" className="h-11" disabled={busy} onClick={onClose}>
                Fechar mesa
              </Button>
            ) : null}
          </div>
          {canSettle ? (
            <Button type="button" variant="destructive" className="h-11" onClick={onVacate}>
              Cancelar / desocupar
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuestDialog({
  open,
  table,
  waiters,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  table: FloorTableSnapshot | null;
  waiters: FloorWaiterOption[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { tableId: string; customerName: string; partySize?: number; waiterId?: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [people, setPeople] = useState("2");
  const [waiterId, setWaiterId] = useState("");
  useEffect(() => {
    if (!open) return;
    setName(table?.customerName ?? "");
    setPeople(table?.partySize ? String(table.partySize) : "2");
    setWaiterId(table?.waiterId ?? "");
  }, [open, table?.id]);
  if (!table) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cliente da mesa {table.number}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({ tableId: table.id, customerName: name, partySize: Number(people) || undefined, waiterId: waiterId || undefined });
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} className="h-12" placeholder="Nome" />
          <Input type="number" min={1} value={people} onChange={(event) => setPeople(event.target.value)} className="h-12" />
          <select className="h-12 rounded-lg border bg-background px-3" value={waiterId} onChange={(event) => setWaiterId(event.target.value)}>
            <option value="">Garçom</option>
            {waiters.map((waiter) => (
              <option key={waiter.id} value={waiter.id}>
                {waiter.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={busy} className="h-12">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PickTableDialog({
  open,
  title,
  description,
  tables,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  tables: FloorTableSnapshot[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (destinationTableId: string) => Promise<void>;
}) {
  const [destination, setDestination] = useState(tables[0]?.id ?? "");
  useEffect(() => {
    if (!open) return;
    setDestination(tables[0]?.id ?? "");
  }, [open, tables[0]?.id]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(destination);
          }}
        >
          <select className="h-12 rounded-lg border bg-background px-3" value={destination} onChange={(event) => setDestination(event.target.value)}>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Mesa {table.number} · {table.sectorName}
              </option>
            ))}
          </select>
          <Button type="submit" className="h-12" disabled={busy || !destination}>
            Confirmar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SplitDialog({
  open,
  table,
  freeTables,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  table: FloorTableSnapshot | null;
  freeTables: FloorTableSnapshot[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { tableId: string; destinationTableId: string; itemIds: string[] }) => Promise<void>;
}) {
  const [destination, setDestination] = useState(freeTables[0]?.id ?? "");
  const [itemIds, setItemIds] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    setDestination(freeTables[0]?.id ?? "");
    setItemIds([]);
  }, [open, table?.id, freeTables[0]?.id]);
  if (!table) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dividir comanda da mesa {table.number}</DialogTitle>
          <DialogDescription>Os itens marcados vão para outra mesa livre.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({ tableId: table.id, destinationTableId: destination, itemIds });
          }}
        >
          <select className="h-12 rounded-lg border bg-background px-3" value={destination} onChange={(event) => setDestination(event.target.value)}>
            {freeTables.map((item) => (
              <option key={item.id} value={item.id}>
                Mesa {item.number}
              </option>
            ))}
          </select>
          <fieldset className="grid gap-2">
            {(table.order?.items ?? []).map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={itemIds.includes(item.id)}
                  onChange={(event) => {
                    setItemIds((current) =>
                      event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    );
                  }}
                />
                {item.quantity}× {item.name}
              </label>
            ))}
          </fieldset>
          <Button type="submit" className="h-12" disabled={busy || !destination || itemIds.length === 0}>
            Dividir
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

