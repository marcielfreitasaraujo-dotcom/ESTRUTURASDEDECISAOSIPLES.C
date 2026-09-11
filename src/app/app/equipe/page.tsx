import { Pencil, Plus, Shield } from "lucide-react";
import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listTeam } from "@/server/services/team";
import { addTeamMemberAction, removeTeamMemberAction, updateTeamMemberAction } from "@/app/actions/ops";
import { canManageTenantMember, hasPermission, isPlatformAdmin, rolesActorCanAssign, type PlatformRole, type TenantRole } from "@/domain/rbac/roles";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/lib/field";
import { initials } from "@/lib/initials";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, SurfaceHeader } from "@/components/ds/surface";
import { StatusPill } from "@/components/ds/data-table";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

function roleTone(role: TenantRole) {
  if (role === "OWNER") return "bg-warning/15 text-warning";
  if (role === "MANAGER") return "bg-info/15 text-info";
  if (role === "CASHIER") return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

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
      ? "Usuário criado com sucesso."
      : ok === "updated"
        ? "Dados do usuário atualizados."
        : ok === "removed"
          ? "Usuário removido da loja."
          : undefined;

  return (
    <PageStack>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários e operadores do sistema. O admin, gerente e proprietário possuem acesso completo."
        backHref="/app"
        actions={
          canWrite ? (
            <Button asChild>
              <a href="#novo-usuario">
                <Plus className="size-4" />
                Novo usuário
              </a>
            </Button>
          ) : null
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {okMessage ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">{okMessage}</p>
      ) : null}

      <Surface>
        <SurfaceHeader
          title="Acessos da equipe"
          description="Use estes usuários para entrar no PDV de cada terminal e ver a tela daquela pessoa."
          action={<Shield className="size-4 text-muted-foreground" />}
        />
        {team.length === 0 ? (
          <EmptyState
            title="Nenhum usuário cadastrado"
            description="Crie o primeiro operador para abrir o caixa com identificação."
            action={
              canWrite ? (
                <Button asChild>
                  <a href="#novo-usuario">Criar primeiro usuário</a>
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              const display = member.user.displayName?.trim() || member.user.name;
              return (
                <article key={member.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
                        {initials(display)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{display}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.user.username || member.user.email}</p>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", roleTone(member.role))}>
                      {TENANT_ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusPill tone={member.active ? "success" : "neutral"}>{member.active ? "Ativo" : "Inativo"}</StatusPill>
                    {canEditThis ? (
                      <details className="relative">
                        <summary className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar {display}</span>
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-none">
                          <form action={updateTeamMemberAction} className="grid gap-2">
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
                            <div className="flex justify-end gap-2 pt-1">
                              {member.userId !== ctx.userId ? (
                                <Button formAction={removeTeamMemberAction} type="submit" variant="outline" size="sm">
                                  Remover
                                </Button>
                              ) : null}
                              <Button type="submit" size="sm">
                                Salvar
                              </Button>
                            </div>
                          </form>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Surface>

      {canWrite ? (
        <Surface>
          <div id="novo-usuario">
            <SurfaceHeader title="Novo usuário" description="Preencha os dados para cadastrar um novo usuário no sistema." />
            <form action={addTeamMemberAction} autoComplete="off" className="grid gap-4 md:grid-cols-3">
              <Field label="Nome completo" htmlFor="new-member-name" required>
                <Input id="new-member-name" name="name" required placeholder="Digite o nome completo" />
              </Field>
              <Field label="Nome de exibição" htmlFor="new-member-display" required>
                <Input id="new-member-display" name="displayName" required placeholder="Digite o nome que será exibido" />
              </Field>
              <Field label="Login" htmlFor="new-member-username" required>
                <Input id="new-member-username" name="username" required placeholder="Digite o login do usuário" />
              </Field>
              <Field label="Senha" htmlFor="new-member-password" required>
                <Input id="new-member-password" name="password" type="password" minLength={8} autoComplete="new-password" required placeholder="Digite a senha" />
              </Field>
              <Field label="Telefone (opcional)" htmlFor="new-member-phone">
                <Input id="new-member-phone" name="phone" placeholder="(00) 00000-0000" />
              </Field>
              <Field label="Perfil" htmlFor="new-member-role" required>
                <select id="new-member-role" name="role" defaultValue="CASHIER" className={nativeSelectClass} required>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {TENANT_ROLE_LABELS[role] ?? role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="E-mail" htmlFor="new-member-email" required>
                <Input id="new-member-email" name="email" type="email" required placeholder="grace.l@example.com" />
              </Field>
              <Field label="Código do operador (opcional)" htmlFor="new-member-code">
                <Input id="new-member-code" name="operatorCode" placeholder="Ex: 001" />
              </Field>
              <div className="flex items-end justify-end gap-2 md:col-span-3">
                <Button type="reset" variant="outline">
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </Surface>
      ) : null}
    </PageStack>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
