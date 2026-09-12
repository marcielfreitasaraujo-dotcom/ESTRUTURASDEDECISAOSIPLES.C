import Link from "next/link";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";

export default async function AcessoNegadoPage() {
  const session = await requireSession().catch(() => null);
  const home = session
    ? postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole })
    : "/entrar";
  const label =
    home === "/caixa" ? "Voltar ao caixa" : home === "/entrega" ? "Voltar às entregas" : home === "/garcom" ? "Voltar às comandas" : "Voltar ao início";

  return (
    <div className="dark flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium text-destructive">403</p>
        <h1 className="mt-2 text-2xl font-semibold">Acesso não autorizado.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta área não faz parte do seu perfil.</p>
        <Link href={home} className="mt-4 inline-block min-h-11 text-sm text-primary underline">
          {label}
        </Link>
      </div>
    </div>
  );
}
