import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/server/context";
import { AppShell } from "@/components/app-shell";

const ITEMS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/tenants", label: "Estabelecimentos" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformAdmin().catch(() => null);
  if (!session) redirect("/entrar");
  return (
    <AppShell title="Plataforma" items={ITEMS} userName={session.name}>
      {children}
    </AppShell>
  );
}
