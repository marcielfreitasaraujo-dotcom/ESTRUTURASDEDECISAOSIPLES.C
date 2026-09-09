import { getPlatformDashboard } from "@/server/services/dashboard";
import { formatBRL } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div>
        <h1 className="text-3xl font-semibold">Painel da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Comanda IA: estabelecimentos, uso e receita. Ações sensíveis geram AuditLog.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
