import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCashTerminals } from "@/server/services/cash-desk";
import { upsertCashTerminalAction } from "@/app/actions/cash-desk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/lib/field";

export default async function TerminaisPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_CONFER);
  const terminals = await listCashTerminals(ctx.tenantId);
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Terminais</h1>
        <p className="text-sm text-zinc-400">O terminal é o equipamento. O operador é a pessoa. Um terminal só pode ter um caixa aberto.</p>
      </div>
      <form action={upsertCashTerminalAction} className="grid gap-3 rounded-2xl border border-zinc-800 bg-card p-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="name">Novo terminal</Label>
          <Input id="name" name="name" required placeholder="Caixa 04" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Código</Label>
          <Input id="code" name="code" placeholder="CX04" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" placeholder="Balcão da frente" />
        </div>
        <Button type="submit" className="sm:col-span-2">
          Cadastrar terminal
        </Button>
      </form>
      <div className="grid gap-3">
        {terminals.map((terminal) => (
          <form key={terminal.id} action={upsertCashTerminalAction} className="grid gap-3 rounded-xl border border-zinc-800 p-4 sm:grid-cols-4">
            <input type="hidden" name="id" value={terminal.id} />
            <Input name="name" defaultValue={terminal.name} aria-label="Nome" />
            <Input name="code" defaultValue={terminal.code ?? ""} aria-label="Código" />
            <select name="active" defaultValue={terminal.active ? "1" : "0"} className={nativeSelectClass} aria-label="Status">
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
            <Button type="submit" variant="outline">
              Salvar
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
