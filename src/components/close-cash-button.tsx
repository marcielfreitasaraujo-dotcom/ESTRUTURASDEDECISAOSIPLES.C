"use client";

import { useState, useTransition } from "react";
import { closeCashRegisterAction } from "@/app/actions/pos";
import { Button } from "@/components/ui/button";

export function CloseCashButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            try {
              await closeCashRegisterAction();
              setMessage("Caixa fechado. O movimento do dia ficou registrado.");
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Não foi possível fechar o caixa.");
            }
          });
        }}
      >
        {pending ? "Fechando..." : "Fechar caixa"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
