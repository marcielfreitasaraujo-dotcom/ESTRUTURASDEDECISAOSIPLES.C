import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { hasPermission, isPlatformAdmin } from "@/domain/rbac/roles";
import { listCatalog } from "@/server/services/catalog";
import { saveCategoryAction, saveProductAction, duplicateProductAction } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";

export default async function CatalogPage() {
  const ctx = await requirePage(PERMISSIONS.CATALOG_WRITE);
  const catalog = await listCatalog(ctx.tenantId);
  const canWrite =
    isPlatformAdmin(ctx.platformRole) ||
    (ctx.tenantRole ? hasPermission(ctx.tenantRole, PERMISSIONS.CATALOG_WRITE) : false);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-heading text-3xl">Cardápio</h1>
        <p className="text-sm text-muted-foreground">Categorias e produtos reais do estabelecimento. Duplicar cria uma cópia inativa.</p>
      </div>
      {canWrite ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nova categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveCategoryAction} className="grid gap-3">
                <Label htmlFor="cat-name">Nome</Label>
                <Input id="cat-name" name="name" required />
                <Button type="submit">Salvar categoria</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Novo produto</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveProductAction} className="grid gap-3">
                <Label htmlFor="prod-name">Nome</Label>
                <Input id="prod-name" name="name" required />
                <Label htmlFor="prod-price">Preço (R$)</Label>
                <Input id="prod-price" name="price" type="number" step="0.01" min="0" required />
                <Label htmlFor="prod-cat">Categoria</Label>
                <select id="prod-cat" name="categoryId" className="h-8 rounded-lg border bg-background px-2 text-sm">
                  <option value="">Sem categoria</option>
                  {catalog.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button type="submit">Salvar produto</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Status</th>
              {canWrite ? <th className="p-3">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {catalog.products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3">{product.name}</td>
                <td className="p-3">{product.category?.name ?? "—"}</td>
                <td className="p-3">{formatBRL(product.promotionalPriceCents ?? product.priceCents)}</td>
                <td className="p-3">{product.active ? "Ativo" : "Inativo"}</td>
                {canWrite ? (
                  <td className="p-3">
                    <form action={duplicateProductAction.bind(null, product.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Duplicar
                      </Button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
