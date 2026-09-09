import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listInventory } from "@/server/services/finance";
import { saveInventoryAction, saveStockMovementAction } from "@/app/actions/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/money";

export default async function EstoquePage() {
  const ctx = await requirePage(PERMISSIONS.INVENTORY_READ);
  const items = await listInventory(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.INVENTORY_WRITE) : false);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Estoque</h1>
        <p className="text-sm text-muted-foreground">Insumos com alerta quando a quantidade chega no mínimo.</p>
      </div>
      {canWrite ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo insumo</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveInventoryAction} className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required placeholder="Mussarela" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Input id="unit" name="unit" defaultValue="kg" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.001" defaultValue={0} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minQuantity">Mínimo</Label>
                  <Input id="minQuantity" name="minQuantity" type="number" step="0.001" defaultValue={0} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Custo unitário (R$)</Label>
                  <Input id="cost" name="cost" type="number" step="0.01" min={0} defaultValue={0} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Adicionar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {items.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Movimentar</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={saveStockMovementAction} className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="itemId">Insumo</Label>
                    <select id="itemId" name="itemId" className="h-8 rounded-lg border bg-background px-2 text-sm">
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <select id="type" name="type" className="h-8 rounded-lg border bg-background px-2 text-sm">
                      <option value="PURCHASE">Compra / entrada</option>
                      <option value="SALE">Saída / uso</option>
                      <option value="LOSS">Perda</option>
                      <option value="ADJUSTMENT">Ajuste</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="qty">Quantidade</Label>
                    <Input id="qty" name="quantity" type="number" step="0.001" min={0.001} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Observação</Label>
                    <Input id="notes" name="notes" />
                  </div>
                  <Button type="submit">Registrar</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
      {items.length === 0 ? (
        <EmptyState title="Estoque vazio" description="Cadastre farinha, queijo e o que a cozinha controla." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Qtd</th>
                <th className="p-3">Mínimo</th>
                <th className="p-3">Custo</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = Number(item.quantity) <= Number(item.minQuantity);
                return (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      {item.name} <span className="text-muted-foreground">({item.unit})</span>
                    </td>
                    <td className="p-3">{Number(item.quantity)}</td>
                    <td className="p-3">{Number(item.minQuantity)}</td>
                    <td className="p-3">{formatBRL(item.costCents)}</td>
                    <td className="p-3">{low ? <span className="text-destructive">Baixo</span> : "OK"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
