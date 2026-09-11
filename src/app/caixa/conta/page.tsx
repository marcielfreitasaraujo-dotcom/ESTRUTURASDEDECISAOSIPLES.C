import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { updateCashierProfileAction } from "@/app/actions/cash";
import { signOutAction } from "@/app/actions/auth";
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
    <div className="grid max-w-lg gap-8">
      <form action={saveProfile} className="grid gap-4">
        <div>
          <h1 className="font-heading text-2xl">Minha conta</h1>
          <p className="text-sm text-muted-foreground">Configurações pessoais. Dados da loja ficam com o gerente.</p>
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
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg">Trocar operador</h2>
        <p className="text-sm text-muted-foreground">
          Encerre sua sessão para outro caixa entrar. O próximo operador precisa autenticar com o próprio usuário. As
          movimentações continuam vinculadas a quem operou.
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="h-11">
            Sair da conta
          </Button>
        </form>
      </section>
    </div>
  );
}
