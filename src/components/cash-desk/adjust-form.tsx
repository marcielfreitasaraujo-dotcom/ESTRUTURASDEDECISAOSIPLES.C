"use client";

import { useState, useTransition } from "react";
import { adjustCashSessionAction } from "@/app/actions/cash-desk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/lib/field";

export function AdjustCashForm({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await adjustCashSessionAction(form);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOk(true);
        });
      }}
    >
      <h2 className="font-heading text-lg">Ajuste autorizado</h2>
      <p className="mt-1 text-sm text-muted-foreground">Não apaga o histórico. Cria uma movimentação de ajuste com auditoria.</p>
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="mt-3 grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="direction">Direção</Label>
          <select id="direction" name="direction" className={nativeSelectClass}>
            <option value="in">Entrada</option>
            <option value="out">Saída</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" name="amount" required placeholder="R$ 10,00" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reason">Motivo</Label>
          <Input id="reason" name="reason" required placeholder="Correção autorizada" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {ok ? <p className="text-sm text-emerald-400">Ajuste registrado.</p> : null}
        <Button type="submit" disabled={pending} variant="outline">
          {pending ? "Salvando..." : "Registrar ajuste"}
        </Button>
      </div>
    </form>
  );
}
