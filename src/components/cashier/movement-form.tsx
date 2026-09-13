"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cashMovementAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SANGRIA_REASONS, SUPPLY_REASONS, EXPENSE_CATEGORIES } from "@/domain/cash/labels";
import { nativeSelectClass } from "@/lib/field";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface } from "@/components/ds/surface";

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
  const reasons = type === "SANGRIA" ? SANGRIA_REASONS : type === "SUPPLY" ? SUPPLY_REASONS : EXPENSE_CATEGORIES;
  const reasonLabel = type === "EXPENSE" ? "Categoria" : "Motivo";

  return (
    <PageStack className="max-w-2xl">
      <PageHeader title={title} description={description} />
      <Surface>
        <form
          className="grid gap-4"
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
          <input type="hidden" name="idempotencyKey" value={key} />
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" required placeholder="R$ 100,00" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">{reasonLabel}</Label>
            <select id="reason" name="reason" className={nativeSelectClass}>
              {reasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observação</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {ok ? <p className="text-sm text-success">Movimentação registrada.</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Confirmar"}
          </Button>
        </form>
      </Surface>
    </PageStack>
  );
}
