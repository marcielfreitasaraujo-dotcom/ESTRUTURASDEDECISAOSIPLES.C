import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { updateCashierProfileAction } from "@/app/actions/cash";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, SurfaceHeader } from "@/components/ds/surface";

async function saveProfile(formData: FormData) {
  "use server";
  await updateCashierProfileAction(formData);
}

export default async function ContaPage() {
  const ctx = await requirePage(PERMISSIONS.CASH_READ);
  return (
    <PageStack className="max-w-2xl">
      <PageHeader
        title="Minha conta"
        description="Configurações pessoais. Dados da loja ficam com o gerente."
      />
      <Surface>
        <SurfaceHeader title="Dados do operador" />
        <form action={saveProfile} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={ctx.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </Surface>
      <Surface>
        <SurfaceHeader
          title="Trocar operador"
          description="Encerre sua sessão para outro caixa entrar. O próximo operador precisa autenticar com o próprio usuário."
        />
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sair da conta
          </Button>
        </form>
      </Surface>
    </PageStack>
  );
}
