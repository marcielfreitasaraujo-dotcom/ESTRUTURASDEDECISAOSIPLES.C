import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { formatClock } from "@/domain/cash/labels";
import { Button } from "@/components/ui/button";

export function ClosedCashState({
  closedAt,
  salesCents,
  differenceCents,
}: {
  closedAt: string;
  salesCents: number;
  differenceCents: number;
}) {
  return (
    <div className="mx-auto grid max-w-lg gap-4 rounded-xl border border-border bg-card p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">Caixa fechado</p>
      <h1 className="font-heading text-3xl">Turno encerrado</h1>
      <p className="text-sm text-muted-foreground">Horário: {formatClock(closedAt)}</p>
      <p className="text-lg">Total vendido: {formatBRL(salesCents)}</p>
      <p className={differenceCents === 0 ? "text-success" : "text-warning"}>
        Diferença: {formatBRL(Math.abs(differenceCents))}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/caixa/turno">Ver resumo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/caixa?abrir=1">Solicitar abertura de novo caixa</Link>
        </Button>
      </div>
    </div>
  );
}
