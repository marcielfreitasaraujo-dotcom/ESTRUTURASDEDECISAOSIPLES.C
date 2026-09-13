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
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";

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
  const banner =
    label.kind === "ok"
      ? "rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success"
      : label.kind === "shortage"
        ? "rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        : "rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning";
  const bannerText =
    label.kind === "ok"
      ? `🟢 Caixa exato · ${formatBRL(0)}`
      : label.kind === "shortage"
        ? `🔴 Falta ${formatBRL(Math.abs(diff))}`
        : `🟡 Sobra ${formatBRL(diff)}`;

  return (
    <PageStack className="max-w-2xl">
      <PageHeader
        title={mode === "count" ? "Contagem do caixa" : "Fechamento de caixa"}
        description={`${operatorName} · aberto em ${formatDay(openedAt)} às ${formatClock(openedAt)}`}
      />
      <Surface>
        <dl className="grid gap-2 text-sm">
        {[
          ["Saldo inicial", totals.openingCents],
          ["Vendas", totals.salesCents],
          ["Dinheiro", totals.cashSalesCents],
          ["PIX", totals.pixCents],
          ["Débito", totals.debitCents],
          ["Crédito", totals.creditCents],
          ["Outros", totals.otherCents],
          ["Suprimentos", totals.supplyCents],
          ["Sangrias", totals.sangriaCents],
          ["Despesas", totals.expenseCents],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{formatBRL(Number(value))}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
          <dt>Saldo físico esperado</dt>
          <dd>{formatBRL(expected)}</dd>
        </div>
        </dl>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="counted">Quanto existe fisicamente no caixa?</Label>
            <Input id="counted" value={counted} onChange={(event) => setCounted(event.target.value)} />
          </div>
          <div className={banner}>{bannerText}</div>
          {mode === "close" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="note">Observação da diferença</Label>
                <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              {confirm ? (
                <div className="grid gap-2 rounded-xl border border-border p-4">
                  <p className="font-medium">Tem certeza que deseja fechar o caixa?</p>
                  <p className="text-sm text-muted-foreground">O fechamento não poderá ser alterado diretamente depois de concluído.</p>
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
                <Button type="button" onClick={() => setConfirm(true)}>
                  Fechar caixa
                </Button>
              )}
            </>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {done ? <p className="text-sm text-success">{done}</p> : null}
        </div>
      </Surface>
    </PageStack>
  );
}
