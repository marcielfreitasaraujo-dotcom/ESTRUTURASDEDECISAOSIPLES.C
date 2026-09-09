import { listAuditLogs } from "@/server/services/tenants";
import { Badge } from "@/components/ui/badge";

export default async function AdminAuditPage() {
  const logs = await listAuditLogs();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Ações sensíveis: login, suspensão de loja e mudanças de papel.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Quando</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Quem</th>
              <th className="p-3">Estabelecimento</th>
              <th className="p-3">Entidade</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhum evento ainda.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {log.createdAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{log.action}</Badge>
                  </td>
                  <td className="p-3">{log.user?.email ?? "sistema"}</td>
                  <td className="p-3">{log.tenant?.name ?? "—"}</td>
                  <td className="p-3">
                    {log.entity}
                    {log.entityId ? <span className="block font-mono text-xs text-muted-foreground">{log.entityId}</span> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
