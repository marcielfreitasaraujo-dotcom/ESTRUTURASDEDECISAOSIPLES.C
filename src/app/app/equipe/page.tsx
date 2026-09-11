import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listTeam } from "@/server/services/team";
import { addTeamMemberAction, removeTeamMemberAction, updateTeamMemberAction } from "@/app/actions/ops";
import { canManageTenantMember, hasPermission, isPlatformAdmin, rolesActorCanAssign, type PlatformRole } from "@/domain/rbac/roles";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nativeSelectClass } from "@/lib/field";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const ctx = await requirePage(PERMISSIONS.TEAM_READ);
  const [{ error, ok }, team] = await Promise.all([searchParams, listTeam(ctx.tenantId)]);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.TEAM_WRITE) : false);
  const actorRole = ctx.tenantRole ?? (isPlatformAdmin(ctx.platformRole) ? "OWNER" : null);
  const roles = actorRole ? rolesActorCanAssign(actorRole, ctx.platformRole) : [];
  const okMessage =
    ok === "created"
      ? "Funcionário criado. Já pode entrar com o e-mail e a senha."
      : ok === "updated"
        ? "Dados do funcionário atualizados."
        : ok === "removed"
          ? "Funcionário removido da loja."
          : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Usuários e operadores</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre operadores do caixa, gerentes e a equipe da loja. O Caixa Geral pode ser usado quando não houver um operador identificado.
        </p>
      </div>
      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{error}</p> : null}
      {okMessage ? <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">{okMessage}</p> : null}
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo funcionário</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addTeamMemberAction} autoComplete="off" className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new-member-name">Nome completo</Label>
                <Input id="new-member-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-display">Nome de exibição</Label>
                <Input id="new-member-display" name="displayName" placeholder="Maria" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-email">E-mail</Label>
                <Input id="new-member-email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-username">Login</Label>
                <Input id="new-member-username" name="username" placeholder="maria" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-password">Senha ou PIN</Label>
                <Input id="new-member-password" name="password" type="password" minLength={8} autoComplete="new-password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-phone">Telefone</Label>
                <Input id="new-member-phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-code">Código do operador</Label>
                <Input id="new-member-code" name="operatorCode" placeholder="OP01" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-member-role">Papel</Label>
                <select id="new-member-role" name="role" defaultValue="CASHIER" className={nativeSelectClass}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {TENANT_ROLE_LABELS[role] ?? role}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Criar login</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4">
        {team.map((member) => {
          const protectedAdmin = isPlatformAdmin((member.user.platformRole ?? "USER") as PlatformRole);
          const canEditThis =
            !protectedAdmin &&
            canWrite &&
            actorRole &&
            (member.userId === ctx.userId ||
              canManageTenantMember(actorRole, member.role, ctx.platformRole));
          const roleOptions =
            member.userId === ctx.userId
              ? [member.role]
              : roles.includes(member.role)
                ? roles
                : [member.role, ...roles];
          return (
            <article key={member.id} className="rounded-xl border bg-card p-4">
              {canEditThis ? (
                <div className="grid gap-3">
                  <form action={updateTeamMemberAction} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="membershipId" value={member.id} />
                    <Input name="name" defaultValue={member.user.name} required aria-label="Nome completo" />
                    <Input name="displayName" defaultValue={member.user.displayName ?? ""} placeholder="Nome de exibição" aria-label="Nome de exibição" />
                    <Input name="email" type="email" defaultValue={member.user.email} required aria-label="E-mail" />
                    <Input name="username" defaultValue={member.user.username ?? ""} placeholder="Login" aria-label="Login" />
                    <Input name="operatorCode" defaultValue={member.user.operatorCode ?? ""} placeholder="Código" aria-label="Código do operador" />
                    <Input name="phone" defaultValue={member.user.phone ?? ""} placeholder="Telefone" aria-label="Telefone" />
                    <Input name="newPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Nova senha (opcional)" aria-label="Nova senha" />
                    <select name="role" defaultValue={member.role} className={nativeSelectClass} aria-label="Papel">
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {TENANT_ROLE_LABELS[role] ?? role}
                        </option>
                      ))}
                    </select>
                    <select name="active" defaultValue={member.active ? "1" : "0"} className={nativeSelectClass} aria-label="Status">
                      <option value="1">Ativo</option>
                      <option value="0">Inativo</option>
                    </select>
                    <Button type="submit">Salvar</Button>
                  </form>
                  {member.userId !== ctx.userId ? (
                    <form action={removeTeamMemberAction}>
                      <input type="hidden" name="membershipId" value={member.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Remover da loja
                      </Button>
                    </form>
                  ) : (
                    <p className="text-xs text-muted-foreground">Este é o seu login.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm">
                  {member.user.name} · {member.user.email} · {TENANT_ROLE_LABELS[member.role] ?? member.role}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
