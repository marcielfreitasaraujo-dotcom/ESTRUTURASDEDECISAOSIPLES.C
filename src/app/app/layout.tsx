import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { isPlatformAdmin, isStoreGerente } from "@/domain/rbac/roles";
import { postLoginPath } from "@/domain/rbac/home";
import { footerNavForUser, groupedGarcomNavForUser, groupedNavForUser, mobileTabNav, navForUser } from "@/domain/rbac/nav";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  if (session.tenantRole === "DELIVERY") redirect("/entrega");

  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, slug: true, tradeName: true } })
    : null;

  const waiter = session.tenantRole === "WAITER" || session.tenantRole === "STAFF";
  const items = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: waiter ? "garcom" : "app",
  });
  const groups = waiter
    ? groupedGarcomNavForUser({
        platformRole: session.platformRole,
        tenantRole: session.tenantRole,
      })
    : groupedNavForUser({
        platformRole: session.platformRole,
        tenantRole: session.tenantRole,
        storefrontHref: tenant?.slug ? `/loja/${tenant.slug}` : undefined,
      });

  return (
    <AppShell
      title={waiter ? "Salão" : "Loja"}
      items={items}
      groups={groups}
      footerItems={footerNavForUser(session.tenantRole)}
      tabs={mobileTabNav({ surface: waiter ? "garcom" : "app", items, groups })}
      userName={session.name}
      roleLabel={session.tenantRole ? TENANT_ROLE_LABELS[session.tenantRole] : undefined}
      storeName={tenant?.tradeName || tenant?.name}
      homeHref={postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole })}
      enableOpsChrome={isStoreGerente(session.tenantRole) || isPlatformAdmin(session.platformRole)}
    >
      {children}
    </AppShell>
  );
}
