import { listTenants } from "@/server/services/tenants";
import { toggleTenantStatusAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ds/page-header";

export default async function TenantsPage() {
  const tenants = await listTenants();

  return (
    <div className="grid gap-6">
      <PageHeader title="Estabelecimentos" description="Suspender impede operação. A ação é auditada." />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Pedidos</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t">
                <td className="p-3">{tenant.name}</td>
                <td className="p-3 font-mono text-xs">{tenant.slug}</td>
                <td className="p-3">
                  <Badge variant={tenant.status === "ACTIVE" ? "default" : "secondary"}>{tenant.status}</Badge>
                </td>
                <td className="p-3">{tenant._count.orders}</td>
                <td className="p-3">{tenant.subscription?.plan.name ?? "—"}</td>
                <td className="p-3">
                  <form
                    action={toggleTenantStatusAction.bind(
                      null,
                      tenant.id,
                      tenant.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
                    )}
                  >
                    <Button type="submit" size="sm" variant="outline">
                      {tenant.status === "SUSPENDED" ? "Reativar" : "Suspender"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
