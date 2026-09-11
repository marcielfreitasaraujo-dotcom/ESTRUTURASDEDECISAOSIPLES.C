"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cashMovementAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SANGRIA_REASONS, SUPPLY_REASONS, EXPENSE_CATEGORIES } from "@/domain/cash/labels";

export function CashMovementForm({
  type,
  title,
  description,
}: {
  type: "SANGRIA" | "SUPPLY" | "EXPENSE";
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [key] = useState(() => crypto.randomUUID());

  return (
    <form
      className="grid max-w-lg gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        form.set("type", type);
        form.set("idempotencyKey", key);
        setError(null);
        startTransition(async () => {
          const result = await cashMovementAction(form);
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
        <h1 className="font-heading text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      <input type="hidden" name="idempotencyKey" value={key} />
      <div className="grid gap-2">
        <Label htmlFor="amount">Valor</Label>
        <Input id="amount" name="amount" required className="h-12 text-lg" placeholder="R$ 100,00" />
      </div>
      {type === "SANGRIA" ? (
        <div className="grid gap-2">
          <Label htmlFor="reason">Motivo</Label>
          <select id="reason" name="reason" className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm">
            {SANGRIA_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
      ) : type === "SUPPLY" ? (
        <div className="grid gap-2">
          <Label htmlFor="reason">Motivo</Label>
          <select id="reason" name="reason" className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm">
            {SUPPLY_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="reason">Categoria</Label>
          <select id="reason" name="reason" className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm">
            {EXPENSE_CATEGORIES.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="notes">Observação</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-400">Movimentação registrada.</p> : null}
      <Button type="submit" disabled={pending} className="h-12">
        {pending ? "Salvando..." : "Confirmar"}
      </Button>
    </form>
  );
}
