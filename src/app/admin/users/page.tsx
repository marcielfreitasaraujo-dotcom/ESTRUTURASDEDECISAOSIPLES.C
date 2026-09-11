import { listPlatformUsers, listTenants } from "@/server/services/tenants";
import {
  createPlatformUserAction,
  removeUserMembershipAction,
  updatePlatformUserAction,
  upsertUserMembershipAction,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_ROLES, TENANT_ROLES } from "@/domain/rbac/roles";
import { PLATFORM_ROLE_LABELS, TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { STAFF_LOGINS } from "@/domain/auth/staff-logins";
import { nativeSelectClass } from "@/lib/field";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const [{ error, ok }, users, tenants] = await Promise.all([searchParams, listPlatformUsers(), listTenants()]);
  const okMessage =
    ok === "created"
      ? "Usuário criado. Já pode entrar."
      : ok === "updated"
        ? "Usuário atualizado."
        : ok === "linked"
          ? "Vínculo com a loja salvo."
          : ok === "unlinked"
            ? "Vínculo removido."
            : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-3xl">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Só o admin altera este painel. O gerente gerencia caixa, garçom e motoboy na Equipe da loja, sem mexer no
          admin.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Acessos da equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Use estes usuários para entrar no PDV de cada papel e ver a tela daquela pessoa.
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {STAFF_LOGINS.map((access) => (
              <li key={access.username} className="rounded-lg border px-3 py-2">
                <p className="font-medium">{access.label}</p>
                <p className="text-muted-foreground">
                  {access.username} / {access.password}
                </p>
                <p className="text-xs text-muted-foreground">Abre em {access.landing}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{error}</p> : null}
      {okMessage ? <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">{okMessage}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
            <form action={createPlatformUserAction} autoComplete="off" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="new-user-name">Nome</Label>
              <Input id="new-user-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-email">E-mail</Label>
              <Input id="new-user-email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-username">Usuário (PDV)</Label>
              <Input id="new-user-username" name="username" placeholder="admin" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-password">Senha</Label>
              <Input id="new-user-password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-platform-role">Papel na plataforma</Label>
              <select id="new-user-platform-role" name="platformRole" defaultValue="USER" className={nativeSelectClass}>
                {PLATFORM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {PLATFORM_ROLE_LABELS[role] ?? role}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-tenant">Loja (opcional)</Label>
              <select id="new-user-tenant" name="tenantId" className={nativeSelectClass}>
                <option value="">Sem loja</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-tenant-role">Papel na loja</Label>
              <select id="new-user-tenant-role" name="tenantRole" defaultValue="STAFF" className={nativeSelectClass}>
                {TENANT_ROLES.map((role) => (
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
      <div className="grid gap-4">
        {users.map((user) => (
          <article key={user.id} className="grid gap-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{user.name}</p>
              {user.username ? (
                <Badge variant="outline">{user.username}</Badge>
              ) : null}
              <Badge variant={user.platformRole === "USER" ? "secondary" : "default"}>
                {PLATFORM_ROLE_LABELS[user.platformRole] ?? user.platformRole}
              </Badge>
            </div>
            <form action={updatePlatformUserAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="userId" value={user.id} />
              <Input name="name" defaultValue={user.name} required aria-label="Nome" />
              <Input name="email" type="email" defaultValue={user.email} required aria-label="E-mail" />
              <Input name="username" defaultValue={user.username ?? ""} placeholder="Usuário" aria-label="Usuário" />
              <Input name="newPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Nova senha (opcional)" aria-label="Nova senha" />
              <select name="platformRole" defaultValue={user.platformRole} className={nativeSelectClass} aria-label="Papel na plataforma">
                {PLATFORM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {PLATFORM_ROLE_LABELS[role] ?? role}
                  </option>
                ))}
              </select>
              <Button type="submit">Salvar</Button>
            </form>
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Lojas</p>
              {user.memberships.length === 0 ? <p className="text-sm text-muted-foreground">Sem estabelecimento.</p> : null}
              {user.memberships.map((membership) => (
                <div key={membership.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {membership.tenant.name} · {TENANT_ROLE_LABELS[membership.role] ?? membership.role}
                  </span>
                  <form action={upsertUserMembershipAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="tenantId" value={membership.tenantId} />
                    <select name="role" defaultValue={membership.role} className={nativeSelectClass}>
                      {TENANT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {TENANT_ROLE_LABELS[role] ?? role}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Alterar papel
                    </Button>
                  </form>
                  <form action={removeUserMembershipAction}>
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Desvincular
                    </Button>
                  </form>
                </div>
              ))}
              <form action={upsertUserMembershipAction} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="userId" value={user.id} />
                <select name="tenantId" className={nativeSelectClass} required>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <select name="role" defaultValue="STAFF" className={nativeSelectClass}>
                  {TENANT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {TENANT_ROLE_LABELS[role] ?? role}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="outline">
                  Vincular à loja
                </Button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
