import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listCustomers, customerCrmStats } from "@/server/services/customers";
import { saveCustomerAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/money";
import { PageHeader } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/surface";
import { redirect } from "next/navigation";

export default async function CustomersPage() {
  const ctx = await requirePage(PERMISSIONS.CUSTOMER_READ);
  if (ctx.tenantRole === "CASHIER") redirect("/caixa/clientes");
  const customers = await listCustomers(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.CUSTOMER_WRITE) : false);
  const stats = customerCrmStats(customers);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Clientes"
        description="CRM do estabelecimento. Quem se identifica na loja (nome e telefone) e os pedidos online ou do caixa entram aqui."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Novos" value={String(stats.newCount)} />
        <StatCard label="Recorrentes" value={String(stats.recurring)} />
        <StatCard label="Inativos" value={String(stats.inactive)} />
      </div>
      {canWrite ? (
      <Card>
        <CardHeader>
          <CardTitle>Novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCustomerAction} className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>
      ) : null}
      {customers.length === 0 ? (
        <EmptyState title="Nenhum cliente" description="Quando alguém pedir, o telefone vira ficha automaticamente." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">Pedidos</th>
                <th className="p-3">Total gasto</th>
                <th className="p-3">Ticket médio</th>
                <th className="p-3">Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="p-3">{customer.name}</td>
                  <td className="p-3 font-mono">{customer.phone}</td>
                  <td className="p-3">{customer._count.orders}</td>
                  <td className="p-3">{formatBRL(customer.orders.reduce((sum, order) => sum + order.totalCents, 0))}</td>
                  <td className="p-3">
                    {customer._count.orders
                      ? formatBRL(Math.round(customer.orders.reduce((sum, order) => sum + order.totalCents, 0) / customer._count.orders))
                      : "—"}
                  </td>
                  <td className="p-3">
                    {customer.orders[0]?.createdAt.toLocaleDateString("pt-BR") ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
