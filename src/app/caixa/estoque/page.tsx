import { requirePage } from "@/server/context";
import { PERMISSIONS } from "@/domain/rbac/permissions";
import { listCatalog } from "@/server/services/catalog";
import { CashierStockPanel } from "@/components/cashier-stock-panel";
import { PageHeader, PageStack } from "@/components/ds/page-header";

export default async function CaixaEstoquePage() {
  const ctx = await requirePage(PERMISSIONS.INVENTORY_WRITE);
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
    <PageStack>
      <PageHeader
        title="Estoque"
        description="Quando zerar um item aqui, ele aparece como Esgotado na loja do cliente."
      />
      <CashierStockPanel products={products} />
    </PageStack>
  );
}
