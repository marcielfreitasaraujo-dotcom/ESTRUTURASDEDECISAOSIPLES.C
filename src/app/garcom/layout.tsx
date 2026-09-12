import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";
import {
  CAIXA_FOOTER_NAV,
  footerNavForUser,
  groupedCaixaNavForUser,
  groupedGarcomNavForUser,
  groupedNavForUser,
  mobileTabNav,
  navForUser,
} from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin, isStoreGerente } from "@/domain/rbac/roles";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WaiterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  const allowed = ["OWNER", "MANAGER", "WAITER", "STAFF", "CASHIER"];
  if (session.tenantRole && !allowed.includes(session.tenantRole) && !isPlatformAdmin(session.platformRole)) {
    redirect(postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole }));
  }

  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, slug: true, tradeName: true } })
    : null;
  const waiterOnly = session.tenantRole === "WAITER" || session.tenantRole === "STAFF";
  const cashier = session.tenantRole === "CASHIER";
  const garcomItems = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: "garcom",
  });
  const caixaItems = navForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
    surface: "caixa",
  });
  const caixaGroups = groupedCaixaNavForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
  });
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

  const waiterGroups = groupedGarcomNavForUser({
    platformRole: session.platformRole,
    tenantRole: session.tenantRole,
  });
  const shell = waiterOnly
    ? {
        title: "Salão",
        items: garcomItems,
        groups: waiterGroups,
        footerItems: footerNavForUser(session.tenantRole),
        tabs: mobileTabNav({ surface: "garcom", items: garcomItems, groups: waiterGroups }),
        homeHref: "/garcom",
      }
    : cashier
      ? {
          title: "Caixa",
          items: caixaItems,
          groups: caixaGroups,
          footerItems: CAIXA_FOOTER_NAV,
          tabs: mobileTabNav({ surface: "caixa", items: caixaItems, groups: caixaGroups }),
          homeHref: "/caixa",
        }
      : {
          title: "Loja",
          items: appItems,
          groups: appGroups,
          footerItems: footerNavForUser(session.tenantRole),
          tabs: mobileTabNav({ surface: "app", items: appItems, groups: appGroups }),
          homeHref: "/app",
        };

  return (
    <AppShell
      title={shell.title}
      items={shell.items}
      groups={shell.groups}
      footerItems={shell.footerItems}
      tabs={shell.tabs}
      userName={session.name}
      roleLabel={session.tenantRole ? TENANT_ROLE_LABELS[session.tenantRole] : undefined}
      storeName={tenant?.tradeName || tenant?.name}
      homeHref={shell.homeHref}
      enableOpsChrome={isStoreGerente(session.tenantRole) || isPlatformAdmin(session.platformRole)}
    >
      {children}
      {waiterOnly ? (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          No celular: menu do navegador → <strong>Adicionar à tela inicial</strong>. O ícone atualiza sozinho.
        </p>
      ) : null}
    </AppShell>
  );
}
