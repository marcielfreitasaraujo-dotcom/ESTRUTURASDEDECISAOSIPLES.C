"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { conferCashSessionAction } from "@/app/actions/cash-desk";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConferCashForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await conferCashSessionAction(form);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOk(true);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid gap-2">
        <Label htmlFor="note">Observação da conferência</Label>
        <Textarea id="note" name="note" rows={3} placeholder="Falta identificada no fechamento." />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-400">Conferência registrada.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Confirmar conferência"}
      </Button>
    </form>
  );
}
