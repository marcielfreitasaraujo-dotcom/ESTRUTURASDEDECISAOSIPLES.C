"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openCashSessionAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClass } from "@/lib/field";

export function OpenCashForm({
  operators,
  terminals,
  defaultOperatorId,
  lockOperator,
  errorMessage,
}: {
  operators: { id: string; name: string }[];
  terminals: { id: string; name: string; active: boolean }[];
  defaultOperatorId?: string;
  lockOperator?: boolean;
  errorMessage?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const [ok, setOk] = useState(false);
  const activeTerminals = terminals.filter((row) => row.active);

  return (
    <form
      className="mx-auto grid max-w-lg gap-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await openCashSessionAction(form);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOk(true);
          router.refresh();
        });
      }}
    >
      <div>
        <h1 className="font-heading text-2xl">Abrir caixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Selecione o operador, o terminal e o repasse inicial do turno.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="operatorId">Operador</Label>
        <select
          id="operatorId"
          name="operatorId"
          defaultValue={defaultOperatorId}
          disabled={lockOperator}
          className={nativeSelectClass}
          required
        >
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name}
            </option>
          ))}
        </select>
        {lockOperator ? <input type="hidden" name="operatorId" value={defaultOperatorId} /> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="terminalId">Terminal</Label>
        <select id="terminalId" name="terminalId" className={nativeSelectClass} required>
          {activeTerminals.map((terminal) => (
            <option key={terminal.id} value={terminal.id}>
              {terminal.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="opening">Repasse inicial / saldo inicial</Label>
        <Input id="opening" name="opening" inputMode="decimal" placeholder="R$ 500,00" required className="h-12 text-lg" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="note">Observação (opcional)</Label>
        <Textarea id="note" name="note" rows={3} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-400">Caixa aberto com sucesso.</p> : null}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? "Abrindo..." : "Abrir caixa"}
      </Button>
    </form>
  );
}
