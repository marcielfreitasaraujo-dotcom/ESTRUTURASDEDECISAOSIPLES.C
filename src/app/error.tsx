"use client";

import { ErrorState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4">
      <ErrorState message="Não foi possível carregar esta página. Tente novamente." />
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
