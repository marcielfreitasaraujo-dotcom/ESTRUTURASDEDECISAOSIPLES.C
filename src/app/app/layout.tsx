import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { isPlatformAdmin } from "@/domain/rbac/roles";
import { navForUser } from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");

  const items = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: "app",
  });

  return (
    <AppShell title="Loja" items={items} userName={session.name} homeHref="/app">
      {children}
    </AppShell>
  );
}
