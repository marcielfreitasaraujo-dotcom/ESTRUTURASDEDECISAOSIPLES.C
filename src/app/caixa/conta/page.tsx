import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { updateCashierProfileAction } from "@/app/actions/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function saveProfile(formData: FormData) {
  "use server";
  await updateCashierProfileAction(formData);
}

export default async function ContaPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_READ);
  return (
    <form action={saveProfile} className="grid max-w-lg gap-4">
      <div>
        <h1 className="font-heading text-2xl">Minha conta</h1>
        <p className="text-sm text-zinc-400">Configurações pessoais. Dados da loja ficam com o gerente.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={ctx.name} className="h-11" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" className="h-11" />
      </div>
      <Button type="submit" className="h-11">
        Salvar
      </Button>
    </form>
  );
}