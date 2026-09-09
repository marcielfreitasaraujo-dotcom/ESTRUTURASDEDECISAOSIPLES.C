import { listPlatformUsers } from "@/server/services/tenants";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  PLATFORM_ADMIN: "Admin da plataforma",
  USER: "Usuário",
  OWNER: "Dono",
  MANAGER: "Gerente",
  CASHIER: "Caixa",
  WAITER: "Garçom",
  KITCHEN: "Cozinha",
  DELIVERY: "Entregador",
  STAFF: "Apoio",
};

export default async function AdminUsersPage() {
  const users = await listPlatformUsers();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Usuários</h1>
        <p className="text-sm text-muted-foreground">Contas da plataforma e em quais estabelecimentos cada uma trabalha.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Papel na plataforma</th>
              <th className="p-3">Estabelecimentos</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3 font-mono text-xs">{user.email}</td>
                <td className="p-3">
                  <Badge variant={user.platformRole === "USER" ? "secondary" : "default"}>
                    {ROLE_LABEL[user.platformRole] ?? user.platformRole}
                  </Badge>
                </td>
                <td className="p-3">
                  {user.memberships.length === 0
                    ? "—"
                    : user.memberships
                        .map(
                          (membership) =>
                            `${membership.tenant.name} (${ROLE_LABEL[membership.role] ?? membership.role})`,
                        )
                        .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
