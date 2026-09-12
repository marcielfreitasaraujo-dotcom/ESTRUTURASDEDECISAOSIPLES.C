import Link from "next/link";
import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listDeliveryOps } from "@/server/services/ops";
import { saveZoneAction, saveDriverAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/money";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageStack } from "@/components/ds/page-header";
import { Surface, SurfaceHeader } from "@/components/ds/surface";

export default async function EntregasOpsPage() {
  const ctx = await requirePage(PERMISSIONS.DELIVERY_READ);
  const { zones, drivers } = await listDeliveryOps(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.DELIVERY_UPDATE) : false);

  return (
    <PageStack>
      <PageHeader
        title="Entregas"
        description="Zonas de taxa e cadastro de motoboys da loja."
        actions={
          <Button asChild>
            <Link href="/entrega">Fila do motoboy</Link>
          </Button>
        }
      />
      {canWrite ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Surface>
            <SurfaceHeader title="Nova zona" description="Bairro, taxa e pedido mínimo." />
            <form action={saveZoneAction} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="zone-name">Nome</Label>
                <Input id="zone-name" name="name" required placeholder="Centro" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-fee">Taxa (R$)</Label>
                <Input id="zone-fee" name="fee" type="number" step="0.01" min="0" defaultValue="5" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-min">Pedido mínimo (R$)</Label>
                <Input id="zone-min" name="minOrder" type="number" step="0.01" min="0" defaultValue="25" />
              </div>
              <Button type="submit">Salvar zona</Button>
            </form>
          </Surface>
          <Surface>
            <SurfaceHeader title="Novo motoboy" description="Quem sai para entregar." />
            <form action={saveDriverAction} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="driver-name">Nome</Label>
                <Input id="driver-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driver-phone">Telefone</Label>
                <Input id="driver-phone" name="phone" required />
              </div>
              <Button type="submit">Salvar motoboy</Button>
            </form>
          </Surface>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Surface padded={false}>
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Zonas</h2>
          </div>
          {zones.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhuma zona" description="Cadastre bairros e taxas de entrega." />
            </div>
          ) : (
            <ul>
              {zones.map((zone) => (
                <li key={zone.id} className="border-b border-border px-4 py-3 text-sm last:border-0">
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Taxa {formatBRL(zone.feeCents)} · mínimo {formatBRL(zone.minOrderCents)}
                    {zone.active ? "" : " · inativa"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Surface>
        <Surface padded={false}>
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Motoboys</h2>
          </div>
          {drivers.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhum motoboy" description="Cadastre quem sai para entregar." />
            </div>
          ) : (
            <ul>
              {drivers.map((driver) => (
                <li key={driver.id} className="border-b border-border px-4 py-3 text-sm last:border-0">
                  {driver.name} · {driver.phone} · {driver.status}
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </PageStack>
  );
}
