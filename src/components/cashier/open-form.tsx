"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openCashSessionAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatClock, formatDay } from "@/domain/cash/labels";

export function OpenCashForm({
  blocked,
}: {
  blocked?: {
    operatorName: string;
    openedAt: string;
    terminalName: string;
  } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  if (blocked) {
    return (
      <div className="mx-auto grid max-w-lg gap-4 rounded-2xl border border-amber-500/30 bg-card p-6">
        <p className="text-sm font-medium text-amber-300">Existe um caixa aberto.</p>
        <h1 className="font-heading text-2xl">Este terminal já está em uso</h1>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-400">Operador</dt>
            <dd>{blocked.operatorName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Data</dt>
            <dd>{formatDay(blocked.openedAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Horário</dt>
            <dd>{formatClock(blocked.openedAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Terminal</dt>
            <dd>{blocked.terminalName}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form
      className="mx-auto grid max-w-lg gap-4 rounded-2xl border border-zinc-800 bg-card p-6"
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
        <h1 className="font-heading text-2xl">Abra seu caixa para começar</h1>
        <p className="mt-1 text-sm text-zinc-400">Informe o valor inicial / troco do turno.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="opening">Valor inicial</Label>
        <Input id="opening" name="opening" inputMode="decimal" placeholder="R$ 200,00" required className="h-12 text-lg" />
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
