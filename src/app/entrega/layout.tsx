import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";
import { footerNavForUser, groupedEntregaNavForUser, groupedNavForUser, mobileTabNav, navForUser } from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin, isStoreGerente } from "@/domain/rbac/roles";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EntregaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  const allowed = ["OWNER", "MANAGER", "DELIVERY"];
  if (session.tenantRole && !allowed.includes(session.tenantRole) && !isPlatformAdmin(session.platformRole)) {
    redirect(postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole }));
  }

  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, slug: true, tradeName: true } })
    : null;
  const motoboy = session.tenantRole === "DELIVERY";
  const entregaItems = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: "entrega",
  });
  const entregaGroups = groupedEntregaNavForUser();
  const appItems = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: "app",
  });
  const appGroups = groupedNavForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    storefrontHref: tenant?.slug ? `/loja/${tenant.slug}` : undefined,
  });

  return (
    <AppShell
      title={motoboy ? "Entrega" : "Loja"}
      items={motoboy ? entregaItems : appItems}
      groups={motoboy ? entregaGroups : appGroups}
      footerItems={motoboy ? undefined : footerNavForUser(session.tenantRole)}
      tabs={
        motoboy
          ? mobileTabNav({ surface: "entrega", items: entregaItems, groups: entregaGroups })
          : mobileTabNav({ surface: "app", items: appItems, groups: appGroups })
      }
      userName={session.name}
      roleLabel={session.tenantRole ? TENANT_ROLE_LABELS[session.tenantRole] : undefined}
      storeName={tenant?.tradeName || tenant?.name}
      homeHref={motoboy ? "/entrega" : "/app"}
      enableOpsChrome={isStoreGerente(session.tenantRole) || isPlatformAdmin(session.platformRole)}
    >
      {children}
    </AppShell>
  );
}
