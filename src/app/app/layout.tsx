import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { isPlatformAdmin } from "@/domain/rbac/roles";
import { footerNavForUser, groupedNavForUser, navForUser } from "@/domain/rbac/nav";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");

  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, slug: true } })
    : null;

  const items = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: "app",
  });
  const groups = groupedNavForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    storefrontHref: tenant?.slug ? `/loja/${tenant.slug}` : undefined,
  });

  return (
    <AppShell
      title="Loja"
      items={items}
      groups={groups}
      footerItems={footerNavForUser(session.tenantRole)}
      userName={session.name}
      roleLabel={session.tenantRole ? TENANT_ROLE_LABELS[session.tenantRole] : undefined}
      storeName={tenant?.name}
      homeHref="/app"
      enableOpsChrome={Boolean(session.tenantRole)}
    >
      {children}
    </AppShell>
  );
}
