import { getPlatformDashboard } from "@/server/services/dashboard";
import { formatBRL } from "@/lib/money";
import { PageHeader } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/surface";

export default async function AdminHomePage() {
  const metrics = await getPlatformDashboard();
  const cards = [
    ["Tenants", String(metrics.tenants)],
    ["Ativos", String(metrics.active)],
    ["Suspensos", String(metrics.suspended)],
    ["Usuários", String(metrics.users)],
    ["Pedidos processados", String(metrics.orders)],
    ["GMV", formatBRL(metrics.gmvCents)],
    ["MRR", formatBRL(metrics.mrrCents)],
    ["ARR", formatBRL(metrics.arrCents)],
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Painel da plataforma"
        description="Comanda IA: estabelecimentos, uso e receita. Ações sensíveis geram auditoria."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
