"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openCashSessionAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClass } from "@/lib/field";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";

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
    <PageStack className="max-w-2xl">
      <PageHeader
        title="Abrir caixa"
        description="Selecione o operador, o terminal e o repasse inicial do turno."
      />
      <Surface>
        <form
          className="grid gap-4"
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
            <Input id="opening" name="opening" inputMode="decimal" placeholder="R$ 500,00" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea id="note" name="note" rows={3} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {ok ? <p className="text-sm text-success">Caixa aberto com sucesso.</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Abrindo..." : "Abrir caixa"}
          </Button>
        </form>
      </Surface>
    </PageStack>
  );
}
