import { listPlansWithSubs } from "@/server/services/tenants";
import { formatBRL } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ds/page-header";

export default async function AdminPlansPage() {
  const plans = await listPlansWithSubs();

  return (
    <div className="grid gap-6">
      <PageHeader title="Planos" description="Assinaturas ativas por plano comercial." />
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="font-mono text-xs text-muted-foreground">{plan.code}</p>
              </div>
              <p className="text-sm font-medium">{formatBRL(plan.monthlyPriceCents)}/mês</p>
            </div>
            {plan.description ? <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p> : null}
            <p className="mt-3 text-sm">
              {plan.subscriptions.length} assinatura{plan.subscriptions.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-3 grid gap-2">
              {plan.subscriptions.map((subscription) => (
                <li key={subscription.id} className="flex items-center justify-between text-sm">
                  <span>
                    {subscription.tenant.name}{" "}
                    <span className="font-mono text-xs text-muted-foreground">/{subscription.tenant.slug}</span>
                  </span>
                  <Badge variant="secondary">{subscription.status}</Badge>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
