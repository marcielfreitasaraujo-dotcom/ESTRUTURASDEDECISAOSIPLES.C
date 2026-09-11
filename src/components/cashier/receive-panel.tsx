"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authorizeManagerAction, receivePaymentAction, searchCashierAction } from "@/app/actions/cash";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { changeCents, remainingCents, splitEqually } from "@/domain/cash/math";
import { CASH_TENDER_OPTIONS } from "@/domain/cash/labels";
import type { CashTenderInput } from "@/domain/cash/math";

type OrderPayload = {
  id: string;
  publicCode: string;
  customerName: string;
  tableNumber: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  items: { id: string; name: string; quantity: number; totalCents: number }[];
};

type Line = CashTenderInput & { id: string };

function parseMoney(value: string) {
  try {
    return parseBRLToCents(value);
  } catch {
    return 0;
  }
}

export function ReceivePaymentPanel({
  order,
  maxDiscountPercent,
}: {
  order: OrderPayload;
  maxDiscountPercent: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>([
    { id: "1", method: "CASH", amountCents: order.totalCents, receivedCents: order.totalCents },
  ]);
  const [discountInput, setDiscountInput] = useState("0");
  const [coupon, setCoupon] = useState("");
  const [people, setPeople] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState({ open: false, login: "", password: "", reason: "", id: "" });
  const [lock, setLock] = useState(false);

  const discountCents = parseMoney(discountInput);
  const due = Math.max(0, order.subtotalCents + order.deliveryFeeCents - discountCents);
  const allocated = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const remaining = remainingCents(due, allocated);

  const cashLine = lines.find((line) => line.method === "CASH");
  const cashChange = useMemo(() => {
    if (!cashLine) return 0;
    try {
      return changeCents(cashLine.amountCents, cashLine.receivedCents ?? cashLine.amountCents);
    } catch {
      return 0;
    }
  }, [cashLine]);

  function addLine(option: (typeof CASH_TENDER_OPTIONS)[number]) {
    setLines((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        method: option.method,
        cardKind: option.cardKind,
        amountCents: Math.max(0, remaining),
        receivedCents: option.method === "CASH" ? Math.max(0, remaining) : undefined,
        confirmPix: false,
      },
    ]);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-card p-4">
        <div>
          <p className="text-sm text-zinc-400">Receber pagamento</p>
          <h1 className="font-heading text-2xl">Pedido #{order.publicCode}</h1>
          <p className="text-sm text-zinc-400">
            {order.customerName}
            {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
          </p>
        </div>
        <ul className="grid gap-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatBRL(item.totalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-1 border-t border-zinc-800 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatBRL(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa</dt>
            <dd>{formatBRL(order.deliveryFeeCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto</dt>
            <dd>{formatBRL(discountCents)}</dd>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatBRL(due)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid gap-2">
          <Label>Cupom</Label>
          <Input value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} placeholder="CLIENTE10" />
        </div>
        <div className="grid gap-2">
          <Label>Desconto (R$)</Label>
          <Input value={discountInput} onChange={(event) => setDiscountInput(event.target.value)} />
          <p className="text-xs text-zinc-500">Limite do caixa: {maxDiscountPercent}%</p>
        </div>
        <div className="grid gap-2">
          <Label>Dividir por pessoas</Label>
          <div className="flex gap-2">
            <Input value={people} onChange={(event) => setPeople(event.target.value)} className="h-11" />
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                const count = Number(people);
                try {
                  const parts = splitEqually(due, count);
                  setLines(
                    parts.map((amountCents) => ({
                      id: crypto.randomUUID(),
                      method: "CASH",
                      amountCents,
                      receivedCents: amountCents,
                    })),
                  );
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Não foi possível dividir a conta.");
                }
              }}
            >
              Dividir
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CASH_TENDER_OPTIONS.map((option) => (
            <Button key={option.label} type="button" variant="outline" className="h-11" onClick={() => addLine(option)}>
              {option.label}
            </Button>
          ))}
        </div>

        <ul className="grid gap-3">
          {lines.map((line) => (
            <li key={line.id} className="grid gap-2 rounded-xl border border-zinc-800 p-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>
                  {line.method === "CARD" ? (line.cardKind === "CREDIT" ? "Cartão de crédito" : "Cartão de débito") : line.method === "CASH" ? "Dinheiro" : line.method === "PIX" ? "PIX" : "Outros"}
                </span>
                <button type="button" className="text-xs text-zinc-500" onClick={() => setLines((current) => current.filter((row) => row.id !== line.id))}>
                  Remover
                </button>
              </div>
              <Input
                value={(line.amountCents / 100).toFixed(2).replace(".", ",")}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((row) => (row.id === line.id ? { ...row, amountCents: parseMoney(event.target.value) } : row)),
                  )
                }
              />
              {line.method === "CASH" ? (
                <>
                  <Label>Valor recebido</Label>
                  <Input
                    value={((line.receivedCents ?? line.amountCents) / 100).toFixed(2).replace(".", ",")}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((row) =>
                          row.id === line.id ? { ...row, receivedCents: parseMoney(event.target.value) } : row,
                        ),
                      )
                    }
                  />
                  <p className="text-sm text-emerald-400">Troco: {formatBRL(cashChange)}</p>
                </>
              ) : null}
              {line.method === "PIX" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(line.confirmPix)}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((row) => (row.id === line.id ? { ...row, confirmPix: event.target.checked } : row)),
                      )
                    }
                  />
                  Confirmar pagamento PIX
                </label>
              ) : null}
              {line.method === "CARD" && line.cardKind === "CREDIT" ? (
                <Input
                  placeholder="Parcelas"
                  value={String(line.installments ?? 1)}
                  onChange={(event) =>
                    setLines((current) =>
                      current.map((row) =>
                        row.id === line.id ? { ...row, installments: Number(event.target.value) || 1 } : row,
                      ),
                    )
                  }
                />
              ) : null}
            </li>
          ))}
        </ul>
        <p className={remaining === 0 ? "text-sm text-emerald-400" : "text-sm text-amber-300"}>
          Restante: {formatBRL(Math.max(0, remaining))}
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {auth.open ? (
          <div className="grid gap-2 rounded-xl border border-amber-500/30 p-3">
            <p className="text-sm text-amber-200">Solicitar autorização do gerente</p>
            <Input placeholder="Usuário do gerente" value={auth.login} onChange={(event) => setAuth({ ...auth, login: event.target.value })} />
            <Input type="password" placeholder="Senha do gerente" value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} />
            <Input placeholder="Motivo" value={auth.reason} onChange={(event) => setAuth({ ...auth, reason: event.target.value })} />
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await authorizeManagerAction({
                    login: auth.login,
                    password: auth.password,
                    kind: "DISCOUNT",
                    reason: auth.reason,
                    amountCents: discountCents,
                    orderId: order.id,
                  });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setAuth({ ...auth, open: false, id: result.authorizationId, password: "" });
                });
              }}
            >
              Autorizar
            </Button>
          </div>
        ) : null}

        <Button
          type="button"
          disabled={pending || lock}
          className="h-12 text-base"
          onClick={() => {
            if (lock) return;
            setLock(true);
            setError(null);
            startTransition(async () => {
              const result = await receivePaymentAction({
                orderId: order.id,
                tenders: lines.map(({ id: _id, ...tender }) => tender),
                discountCents,
                couponCode: coupon || undefined,
                authorizationId: auth.id || undefined,
                idempotencyKey: crypto.randomUUID(),
              });
              if (!result.ok) {
                if (result.error.includes("Desconto acima")) setAuth((current) => ({ ...current, open: true }));
                setError(result.error);
                setLock(false);
                return;
              }
              router.push(result.allPaid ? "/caixa?ok=pago" : `/caixa/pagamentos?pedido=${order.id}`);
              router.refresh();
            });
          }}
        >
          {pending ? "Finalizando..." : "Finalizar pagamento"}
        </Button>
      </section>
    </div>
  );
}

export function PendingPaymentsList({
  orders,
}: {
  orders: { id: string; publicCode: string; customerName: string; tableNumber: string | null; totalCents: number }[];
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState(orders);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!query.trim()) {
        setHits(orders);
        return;
      }
      void searchCashierAction(query).then((result) => {
        setHits(
          result.orders.map((row) => ({
            id: row.id,
            publicCode: row.publicCode,
            customerName: row.customerName,
            tableNumber: row.tableNumber,
            totalCents: row.totalCents,
          })),
        );
      });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, orders]);

  return (
    <div className="grid gap-4">
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pedido, mesa ou cliente" className="h-12" />
      <ul className="grid gap-2">
        {hits.map((order) => (
          <li key={order.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-card px-4 py-3">
            <div>
              <p className="font-medium">Pedido #{order.publicCode}</p>
              <p className="text-xs text-zinc-500">
                {order.tableNumber ? `Mesa ${order.tableNumber}` : "Balcão"} · {order.customerName}
              </p>
              <p className="text-xs text-amber-300">Aguardando pagamento</p>
            </div>
            <div className="text-right">
              <p>{formatBRL(order.totalCents)}</p>
              <a href={`/caixa/pagamentos?pedido=${order.id}`} className="text-sm text-primary underline">
                Receber pagamento
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
