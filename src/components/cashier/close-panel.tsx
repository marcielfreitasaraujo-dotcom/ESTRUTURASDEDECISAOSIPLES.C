"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeCashSessionAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { differenceCents, differenceLabel, expectedCashCents } from "@/domain/cash/math";
import { formatClock, formatDay } from "@/domain/cash/labels";

export function CloseCashPanel({
  mode,
  operatorName,
  openedAt,
  totals,
}: {
  mode: "count" | "close";
  operatorName: string;
  openedAt: string;
  totals: {
    openingCents: number;
    salesCents: number;
    cashSalesCents: number;
    pixCents: number;
    debitCents: number;
    creditCents: number;
    otherCents: number;
    sangriaCents: number;
    supplyCents: number;
    expenseCents: number;
    expectedCashCents: number;
    paidCount: number;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  const countedCents = useMemo(() => {
    try {
      return counted ? parseBRLToCents(counted) : 0;
    } catch {
      return 0;
    }
  }, [counted]);
  const expected = expectedCashCents({
    openingCents: totals.openingCents,
    cashSalesCents: totals.cashSalesCents,
    supplyCents: totals.supplyCents,
    sangriaCents: totals.sangriaCents,
    expenseCents: totals.expenseCents,
  });
  const diff = differenceCents(expected, countedCents);
  const label = differenceLabel(diff);

  return (
    <div className="grid max-w-xl gap-5">
      <div>
        <h1 className="font-heading text-2xl">{mode === "count" ? "Conferir caixa" : "Fechar caixa"}</h1>
        <p className="text-sm text-zinc-400">
          {operatorName} · aberto em {formatDay(openedAt)} às {formatClock(openedAt)}
        </p>
      </div>
      <dl className="grid gap-2 rounded-xl border border-zinc-800 bg-card p-4 text-sm">
        {[
          ["Saldo inicial", totals.openingCents],
          ["Vendas em dinheiro", totals.cashSalesCents],
          ["PIX", totals.pixCents],
          ["Débito", totals.debitCents],
          ["Crédito", totals.creditCents],
          ["Outros", totals.otherCents],
          ["Suprimentos", totals.supplyCents],
          ["Sangrias", totals.sangriaCents],
          ["Despesas", totals.expenseCents],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between">
            <dt className="text-zinc-400">{label}</dt>
            <dd>{formatBRL(Number(value))}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-zinc-800 pt-2 text-base font-medium">
          <dt>Dinheiro esperado</dt>
          <dd>{formatBRL(expected)}</dd>
        </div>
      </dl>
      <div className="grid gap-2">
        <Label htmlFor="counted">Dinheiro contado</Label>
        <Input id="counted" value={counted} onChange={(event) => setCounted(event.target.value)} className="h-12 text-lg" />
      </div>
      <div
        className={
          label.kind === "ok"
            ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
            : "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
        }
      >
        {label.label}: {formatBRL(Math.abs(diff))}
      </div>
      {mode === "close" ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="note">Observação da diferença</Label>
            <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          {confirm ? (
            <div className="grid gap-2 rounded-xl border border-zinc-800 p-4">
              <p className="font-medium">Tem certeza que deseja fechar o caixa?</p>
              <p className="text-sm text-zinc-400">O fechamento não poderá ser alterado diretamente depois de concluído.</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const form = new FormData();
                    form.set("counted", counted);
                    form.set("note", note);
                    form.set("confirm", "1");
                    startTransition(async () => {
                      const result = await closeCashSessionAction(form);
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      setDone("Caixa fechado com sucesso.");
                      router.push("/caixa");
                      router.refresh();
                    });
                  }}
                >
                  Confirmar fechamento
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" className="h-12" onClick={() => setConfirm(true)}>
              Fechar caixa
            </Button>
          )}
        </>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {done ? <p className="text-sm text-emerald-400">{done}</p> : null}
    </div>
  );
}
