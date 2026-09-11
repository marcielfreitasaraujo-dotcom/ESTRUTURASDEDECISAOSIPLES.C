import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { getStoreSettings } from "@/server/services/settings";
import { saveStoreAction } from "@/app/actions/ops";
import { createSalonSectorAction } from "@/app/actions/floor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const METHODS = [
  ["PIX", "PIX"],
  ["CASH", "Dinheiro"],
  ["CARD", "Cartão"],
] as const;

export default async function SettingsPage() {
  const ctx = await requirePage(PERMISSIONS.SETTINGS_READ);
  const tenant = await getStoreSettings(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.SETTINGS_WRITE) : false);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Loja</h1>
        <p className="text-sm text-muted-foreground">Dados que o cardápio público e o caixa usam.</p>
      </div>
      <form action={saveStoreAction} className="grid max-w-3xl gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={tenant.name} required disabled={!canWrite} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tradeName">Nome fantasia</Label>
            <Input id="tradeName" name="tradeName" defaultValue={tenant.tradeName ?? ""} disabled={!canWrite} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} disabled={!canWrite} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={tenant.whatsapp ?? ""} disabled={!canWrite} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" defaultValue={tenant.city ?? ""} disabled={!canWrite} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" name="state" defaultValue={tenant.state ?? ""} disabled={!canWrite} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="estimatedMinutes">Tempo estimado (min)</Label>
            <Input
              id="estimatedMinutes"
              name="estimatedMinutes"
              type="number"
              defaultValue={tenant.estimatedMinutes}
              disabled={!canWrite}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minimumOrder">Pedido mínimo (R$)</Label>
            <Input
              id="minimumOrder"
              name="minimumOrder"
              type="number"
              step="0.01"
              defaultValue={(tenant.minimumOrderCents / 100).toFixed(2)}
              disabled={!canWrite}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tableCount">Mesas no salão</Label>
            <Input
              id="tableCount"
              name="tableCount"
              type="number"
              min={1}
              max={80}
              defaultValue={tenant.tableCount}
              disabled={!canWrite}
            />
            <p className="text-xs text-muted-foreground">O caixa mostra essas mesas no PDV. Livre numa cor, ocupada em outra.</p>
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Pagamentos aceitos</legend>
          {METHODS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="method"
                value={value}
                defaultChecked={tenant.paymentMethods.find((item) => item.method === value)?.enabled ?? true}
                disabled={!canWrite}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-3">
          <h2 className="font-medium">Horários</h2>
          {DAYS.map((label, weekday) => {
            const hour = tenant.hours.find((item) => item.weekday === weekday);
            return (
              <div key={weekday} className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-2 text-sm">
                <span>{label}</span>
                <Input name={`opens_${weekday}`} defaultValue={hour?.opensAt ?? "18:00"} disabled={!canWrite} />
                <Input name={`closes_${weekday}`} defaultValue={hour?.closesAt ?? "23:30"} disabled={!canWrite} />
                <label className="flex items-center gap-1">
                  <input type="checkbox" name={`closed_${weekday}`} defaultChecked={hour?.closed} disabled={!canWrite} />
                  Fecha
                </label>
              </div>
            );
          })}
        </div>
        {canWrite ? <Button type="submit">Salvar loja</Button> : null}
      </form>
      <section className="grid max-w-3xl gap-3 rounded-2xl border p-4">
        <h2 className="font-medium">Setores do salão</h2>
        <ul className="text-sm text-muted-foreground">
          {(tenant.salonSectors ?? []).map((sector) => (
            <li key={sector.id}>{sector.name}</li>
          ))}
          {(tenant.salonSectors ?? []).length === 0 ? <li>O PDV cria o Salão automaticamente.</li> : null}
        </ul>
        {canWrite ? (
          <form action={createSalonSectorAction} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="sectorName">Novo setor</Label>
              <Input id="sectorName" name="sectorName" placeholder="Varanda" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sectorTableCount">Mesas</Label>
              <Input id="sectorTableCount" name="sectorTableCount" type="number" min={1} max={80} defaultValue={4} />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
