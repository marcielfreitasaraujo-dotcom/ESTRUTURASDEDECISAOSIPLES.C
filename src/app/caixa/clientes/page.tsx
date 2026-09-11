import { requireOpenCashPage } from "@/server/cash-page";
import { listCustomers } from "@/server/services/customers";
import { saveCustomerAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CashierSearch } from "@/components/cashier/search";

export default async function CaixaClientesPage() {
  const ctx = await requireOpenCashPage();
  const customers = await listCustomers(ctx.tenantId);

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl">Clientes</h1>
        <p className="text-sm text-zinc-400">Pesquisa e cadastro durante a venda. CRM e campanhas ficam com o gerente.</p>
      </div>
      <CashierSearch />
      <form action={saveCustomerAction} className="grid gap-3 rounded-2xl border border-zinc-800 bg-card p-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required className="h-11" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" required className="h-11" />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="email">E-mail (opcional)</Label>
          <Input id="email" name="email" type="email" className="h-11" />
        </div>
        <Button type="submit" className="h-11 sm:col-span-2">
          Cadastrar cliente
        </Button>
      </form>
      <ul className="grid gap-2">
        {customers.length === 0 ? (
          <li className="text-sm text-zinc-500">Nenhum cliente cadastrado ainda.</li>
        ) : (
          customers.slice(0, 80).map((customer) => (
            <li key={customer.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-card px-4 py-3">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-zinc-500">{customer.phone}</p>
              </div>
              <p className="text-xs text-zinc-500">{customer._count.orders} pedido(s)</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
