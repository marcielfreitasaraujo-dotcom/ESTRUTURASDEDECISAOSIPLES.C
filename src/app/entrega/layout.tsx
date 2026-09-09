import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";
import { navForUser } from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin } from "@/domain/rbac/roles";

export const dynamic = "force-dynamic";

export default async function EntregaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  const allowed = ["OWNER", "MANAGER", "DELIVERY"];
  if (session.tenantRole && !allowed.includes(session.tenantRole) && !isPlatformAdmin(session.platformRole)) {
    redirect(postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole }));
  }

  return (
    <AppShell
      title="Entrega"
      items={navForUser({ platformRole: session.platformRole, tenantRole: session.tenantRole, surface: "entrega" })}
      userName={session.name}
      homeHref="/entrega"
    >
      <div className="mx-auto max-w-xl">{children}</div>
    </AppShell>
  );
}
