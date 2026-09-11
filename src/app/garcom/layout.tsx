import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";
import { navForUser } from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin } from "@/domain/rbac/roles";

export const dynamic = "force-dynamic";

export default async function WaiterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  const allowed = ["OWNER", "MANAGER", "WAITER", "STAFF", "CASHIER"];
  if (session.tenantRole && !allowed.includes(session.tenantRole) && !isPlatformAdmin(session.platformRole)) {
    redirect(postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole }));
  }

  return (
    <AppShell
      title="Salão"
      items={navForUser({ platformRole: session.platformRole, tenantRole: session.tenantRole, surface: "garcom" })}
      userName={session.name}
      homeHref="/garcom"
    >
      <div className="mx-auto max-w-xl">{children}</div>
      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
        No celular: menu do navegador → <strong>Adicionar à tela inicial</strong>. É o mesmo sistema na nuvem. Ao
        reabrir o ícone, o app busca a versão publicada.{" "}
        <Link className="underline" href="/caixa">
          Abrir caixa
        </Link>
      </p>
    </AppShell>
  );
}
