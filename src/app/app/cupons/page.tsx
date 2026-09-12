import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listCoupons } from "@/server/services/ops";
import { saveCouponAction, toggleCouponAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/money";
import { PageHeader } from "@/components/ds/page-header";

export default async function CuponsPage() {
  const ctx = await requirePage(PERMISSIONS.CATALOG_WRITE);
  const coupons = await listCoupons(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.CATALOG_WRITE) : false);

  return (
    <div className="grid gap-6">
      <PageHeader title="Cupons" description="Códigos de desconto usados no checkout do cliente." />
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo cupom</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveCouponAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" name="code" required placeholder="BEMVINDO10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <select id="type" name="type" className="field-control">
                  <option value="PERCENTAGE">Percentual</option>
                  <option value="FIXED">Valor fixo (centavos no valor)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Valor</Label>
                <Input id="value" name="value" type="number" min={1} defaultValue={10} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minSubtotal">Pedido mínimo (R$)</Label>
                <Input id="minSubtotal" name="minSubtotal" type="number" step="0.01" min={0} defaultValue={0} />
              </div>
              <Button type="submit">Criar</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      {coupons.length === 0 ? (
        <EmptyState title="Nenhum cupom" description="Crie um código para a primeira compra." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Regra</th>
                <th className="p-3">Mínimo</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t">
                  <td className="p-3 font-mono font-semibold">{coupon.code}</td>
                  <td className="p-3">
                    {coupon.type === "PERCENTAGE"
                      ? `${coupon.value}%`
                      : coupon.type === "FIXED"
                        ? formatBRL(coupon.value)
                        : coupon.type}
                  </td>
                  <td className="p-3">{formatBRL(coupon.minSubtotalCents)}</td>
                  <td className="p-3">{coupon.active ? "Ativo" : "Inativo"}</td>
                  <td className="p-3">
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <Button type="submit" size="sm" variant="outline">
                        {coupon.active ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
