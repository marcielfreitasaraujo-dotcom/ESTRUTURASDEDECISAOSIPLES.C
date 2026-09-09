import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { isPlatformAdmin } from "@/domain/rbac/roles";
import { AppShell } from "@/components/app-shell";

const ITEMS = [
  { href: "/app", label: "Painel" },
  { href: "/app/pedidos", label: "Pedidos" },
  { href: "/app/cozinha", label: "Cozinha" },
  { href: "/app/cardapio", label: "Cardápio" },
  { href: "/caixa", label: "Caixa" },
  { href: "/garcom", label: "Garçom" },
];

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");

  return (
    <AppShell title="Estabelecimento" items={ITEMS} userName={session.name} homeHref="/app">
      {children}
    </AppShell>
  );
}
