import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listTeam } from "@/server/services/team";
import { addTeamMemberAction } from "@/app/actions/ops";
import { hasPermission, isPlatformAdmin, TENANT_ROLES } from "@/domain/rbac/roles";
import { ROLES_MANAGER_CAN_ASSIGN } from "@/domain/rbac/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LABELS: Record<string, string> = {
  OWNER: "Dono",
  MANAGER: "Gerente",
  CASHIER: "Caixa",
  WAITER: "Garçom",
  KITCHEN: "Cozinha",
  DELIVERY: "Entregador",
  STAFF: "Apoio",
};

export default async function TeamPage() {
  const ctx = await requirePage(PERMISSIONS.TEAM_READ);
  const team = await listTeam(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.TEAM_WRITE) : false);
  const roles = ctx.tenantRole === "OWNER" ? TENANT_ROLES : ROLES_MANAGER_CAN_ASSIGN;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted-foreground">Cada pessoa entra com o próprio login e cai no app do papel.</p>
      </div>
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar pessoa</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addTeamMemberAction} className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha inicial</Label>
                <Input id="password" name="password" type="password" minLength={8} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Papel</Label>
                <select id="role" name="role" className="h-8 rounded-lg border bg-background px-2 text-sm">
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {LABELS[role] ?? role}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Convidar</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Papel</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="p-3">{member.user.name}</td>
                <td className="p-3">{member.user.email}</td>
                <td className="p-3">{LABELS[member.role] ?? member.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
