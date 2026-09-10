import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { CashierStockPanel } from "@/components/cashier-stock-panel";

export default async function CaixaEstoquePage() {
  const ctx = await requirePage(PERMISSIONS.ORDER_UPDATE);
  const catalog = await listCatalog(ctx.tenantId);
  const products = catalog.products
    .filter((product) => product.active)
    .map((product) => ({
      id: product.id,
      name: product.name,
      categoryName: product.category?.name ?? "Outros",
      priceCents: product.promotionalPriceCents ?? product.priceCents,
      available: product.available,
      trackInventory: product.trackInventory,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
    }));

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-primary">Cardápio</p>
        <h1 className="text-3xl font-semibold">Estoque</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quando zerar um item aqui, ele aparece como Esgotado na loja do cliente.
        </p>
      </div>
      <CashierStockPanel products={products} />
    </div>
  );
}
