import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin } from "@/domain/rbac/roles";

const ITEMS = [
  { href: "/garcom", label: "Nova comanda" },
];

export default async function WaiterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  const allowed = ["OWNER", "MANAGER", "WAITER", "STAFF", "CASHIER"];
  if (session.tenantRole && !allowed.includes(session.tenantRole) && !isPlatformAdmin(session.platformRole)) {
    redirect(postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole }));
  }

  return (
    <AppShell title="Garçom · celular" items={ITEMS} userName={session.name} homeHref="/garcom">
      <div className="mx-auto max-w-xl">{children}</div>
      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
        No celular: menu do navegador → <strong>Adicionar à tela inicial</strong>. É o mesmo sistema na nuvem.{" "}
        <Link className="underline" href="/caixa">
          Abrir caixa
        </Link>
      </p>
    </AppShell>
  );
}
