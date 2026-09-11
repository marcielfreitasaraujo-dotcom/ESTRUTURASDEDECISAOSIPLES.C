import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listTenantAuditLogs } from "@/server/services/dashboard";

export default async function AuditoriaPage() {
  const ctx = await requirePage(PERMISSIONS.SETTINGS_READ);
  const logs = await listTenantAuditLogs(ctx.tenantId, 120);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Somente ações deste estabelecimento. O histórico da plataforma fica no admin.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Quando</th>
              <th className="p-3">Quem</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Módulo</th>
              <th className="p-3">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhuma atividade registrada ainda.
                </td>
              </tr>
            ) : null}
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{log.createdAt.toLocaleString("pt-BR")}</td>
                <td className="p-3">{log.user?.name ?? "Sistema"}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.entity}</td>
                <td className="p-3 text-muted-foreground">{log.entityId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
