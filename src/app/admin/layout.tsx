import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/server/context";
import { PLATFORM_NAV } from "@/domain/rbac/nav";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformAdmin().catch(() => null);
  if (!session) redirect("/entrar");
  return (
    <AppShell title="Plataforma" items={PLATFORM_NAV} userName={session.name} homeHref="/admin">
      {children}
    </AppShell>
  );
}
