import { redirect } from "next/navigation";
import { requireSession } from "@/server/context";
import { postLoginPath } from "@/domain/rbac/home";
import { groupedCaixaNavForUser, CAIXA_FOOTER_NAV, mobileTabNav, navForUser } from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin, isStoreGerente } from "@/domain/rbac/roles";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { prisma } from "@/lib/db";
import { CashierHotkeys } from "@/components/cashier/hotkeys";

export const dynamic = "force-dynamic";

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/entrar");
  if (isPlatformAdmin(session.platformRole) && !session.tenantId) redirect("/admin");
  const allowed = ["OWNER", "MANAGER", "CASHIER"];
  if (session.tenantRole && !allowed.includes(session.tenantRole) && !isPlatformAdmin(session.platformRole)) {
    redirect(postLoginPath({ platformRole: session.platformRole, tenantRole: session.tenantRole }));
  }
  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, tradeName: true } })
    : null;

  const items = navForUser({ platformRole: session.platformRole, tenantRole: session.tenantRole, surface: "caixa" });
  const groups = groupedCaixaNavForUser({ platformRole: session.platformRole, tenantRole: session.tenantRole });

  return (
    <AppShell
      title="Caixa"
      items={items}
      groups={groups}
      footerItems={CAIXA_FOOTER_NAV}
      tabs={mobileTabNav({ surface: "caixa", items, groups })}
      userName={session.name}
      roleLabel={session.tenantRole ? TENANT_ROLE_LABELS[session.tenantRole] : "Caixa"}
      storeName={tenant?.tradeName || tenant?.name}
      homeHref="/caixa"
      enableOpsChrome={isStoreGerente(session.tenantRole) || isPlatformAdmin(session.platformRole)}
    >
      <CashierHotkeys />
      {children}
    </AppShell>
  );
}