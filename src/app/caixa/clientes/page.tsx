import { requireOpenCashPage } from "@/server/cash-page";
import { listCustomers } from "@/server/services/customers";
import { saveCustomerAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CashierSearch } from "@/components/cashier/search";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, SurfaceHeader } from "@/components/ds/surface";
import { EmptyState } from "@/components/empty-state";

export default async function CaixaClientesPage() {
  const ctx = await requireOpenCashPage();
  const customers = await listCustomers(ctx.tenantId);

  return (
    <PageStack>
      <PageHeader
        title="Clientes"
        description="Pesquisa e cadastro durante a venda. CRM e campanhas ficam com o gerente."
      />
      <CashierSearch />
      <Surface>
        <SurfaceHeader title="Cadastrar cliente" />
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
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <Button type="submit" className="sm:col-span-2">
            Cadastrar cliente
          </Button>
        </form>
      </Surface>
      {customers.length === 0 ? (
        <Surface>
          <EmptyState title="Nenhum cliente cadastrado ainda" description="O cadastro feito no PDV aparece nesta lista." />
        </Surface>
      ) : (
        <ul className="grid gap-2">
          {customers.slice(0, 80).map((customer) => (
            <li key={customer.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.phone}</p>
              </div>
              <p className="text-xs text-muted-foreground">{customer._count.orders} pedido(s)</p>
            </li>
          ))}
        </ul>
      )}
    </PageStack>
  );
}
