import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { formatClock } from "@/domain/cash/labels";
import { Button } from "@/components/ui/button";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, StatCard } from "@/components/ds/surface";

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
    <PageStack className="max-w-2xl">
      <PageHeader
        title="Turno encerrado"
        description={`Caixa fechado às ${formatClock(closedAt)}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total vendido" value={formatBRL(salesCents)} />
        <StatCard
          label="Diferença"
          value={formatBRL(Math.abs(differenceCents))}
          tone={differenceCents === 0 ? "success" : "warning"}
        />
      </div>
      <Surface>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/caixa/turno">Ver resumo</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/caixa?abrir=1">Solicitar abertura de novo caixa</Link>
          </Button>
        </div>
      </Surface>
    </PageStack>
  );
}
