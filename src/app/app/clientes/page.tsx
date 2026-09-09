import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listCustomers } from "@/server/services/customers";
import { saveCustomerAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/money";

export default async function CustomersPage() {
  const ctx = await requirePage(PERMISSIONS.CUSTOMER_READ);
  const customers = await listCustomers(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.CUSTOMER_WRITE) : false);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">CRM do estabelecimento. Pedido online e do caixa entram aqui pelo telefone.</p>
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
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="p-3">{customer.name}</td>
                  <td className="p-3 font-mono">{customer.phone}</td>
                  <td className="p-3">{customer._count.orders}</td>
                  <td className="p-3">{formatBRL(customer.orders.reduce((sum, order) => sum + order.totalCents, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
