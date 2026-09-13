import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { getStoreSettings } from "@/server/services/settings";
import { saveStoreAction, sendTrackingTestAction } from "@/app/actions/ops";
import { createSalonSectorAction } from "@/app/actions/floor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ds/page-header";

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
      <PageHeader title="Loja" description="Dados que o cardápio público e o caixa usam." />
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
        <div className="grid gap-3 rounded-xl border p-4">
          <h2 className="font-medium">Regras do caixa</h2>
          <p className="text-sm text-muted-foreground">
            O caixa opera o turno. Estas regras limitam desconto, dinheiro em gaveta e despesa operacional.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cashLimit">Limite de dinheiro no caixa (R$)</Label>
              <Input
                id="cashLimit"
                name="cashLimit"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(tenant.cashLimitCents / 100).toFixed(2)}
                disabled={!canWrite}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxCashierDiscountPercent">Desconto máximo do caixa (%)</Label>
              <Input
                id="maxCashierDiscountPercent"
                name="maxCashierDiscountPercent"
                type="number"
                min={0}
                max={100}
                defaultValue={tenant.maxCashierDiscountPercent}
                disabled={!canWrite}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="cashierCanRegisterExpense"
              defaultChecked={tenant.cashierCanRegisterExpense}
              disabled={!canWrite}
            />
            Permitir o caixa registrar pequenas despesas operacionais
          </label>
        </div>
        <div className="grid gap-3 rounded-xl border p-4">
          <h2 className="font-medium">Acompanhamento de pedidos</h2>
          <p className="text-sm text-muted-foreground">
            Tempo, WhatsApp e o que o cliente vê depois do checkout. O número de teste fica aqui, sem ficar fixo no código.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="trackingEnabled" defaultChecked={tenant.trackingEnabled} disabled={!canWrite} />
            Ativar acompanhamento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="trackingNotifyEnabled" defaultChecked={tenant.trackingNotifyEnabled} disabled={!canWrite} />
            Ativar notificações
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="trackingWhatsappEnabled" defaultChecked={tenant.trackingWhatsappEnabled} disabled={!canWrite} />
            Ativar WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="trackingAllowPickup" defaultChecked={tenant.trackingAllowPickup} disabled={!canWrite} />
            Permitir retirada
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="trackingAllowDelivery" defaultChecked={tenant.trackingAllowDelivery} disabled={!canWrite} />
            Permitir entrega
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="trackingMinMinutes">Tempo mínimo (min)</Label>
              <Input id="trackingMinMinutes" name="trackingMinMinutes" type="number" defaultValue={tenant.trackingMinMinutes} disabled={!canWrite} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trackingMaxMinutes">Tempo máximo (min)</Label>
              <Input id="trackingMaxMinutes" name="trackingMaxMinutes" type="number" defaultValue={tenant.trackingMaxMinutes} disabled={!canWrite} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trackingHistoryDays">Histórico (dias)</Label>
              <Input id="trackingHistoryDays" name="trackingHistoryDays" type="number" defaultValue={tenant.trackingHistoryDays} disabled={!canWrite} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingWhatsappNumber">Número do WhatsApp (avisos e teste)</Label>
            <Input
              id="trackingWhatsappNumber"
              name="trackingWhatsappNumber"
              defaultValue={tenant.trackingWhatsappNumber ?? ""}
              placeholder="Número configurável"
              disabled={!canWrite}
            />
          </div>
        </div>
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
      {canWrite ? (
        <form action={sendTrackingTestAction} className="grid max-w-3xl gap-3 rounded-2xl border p-4">
          <h2 className="font-medium">Mensagem de teste do WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Envia o texto de acompanhamento para o número configurado na loja. O número de teste não fica hardcoded.
          </p>
          <input type="hidden" name="to" value={tenant.trackingWhatsappNumber ?? ""} />
          <Button type="submit" variant="outline">
            Enviar mensagem de teste
          </Button>
        </form>
      ) : null}
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
