import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { listCatalog } from "@/server/services/catalog";
import { getCart } from "@/server/services/cart";
import { getStoreStatus } from "@/domain/hours/store-status";
import { getStoreGuest } from "@/server/store-guest";
import { findActiveOrderForPhone } from "@/server/services/tracking";
import { StoreMenu } from "@/components/storefront/store-menu";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ mesa?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { title: "Loja não encontrada" };
  return {
    title: tenant.name,
    description: `Peça online na ${tenant.name}. Cardápio digital, pizza montada e retirada ou entrega.`,
    openGraph: { title: tenant.name, description: `Cardápio digital da ${tenant.name}` },
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { mesa } = await searchParams;
  const tableNumber = mesa?.trim() || "";
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { hours: true },
  });
  if (!tenant || tenant.status === "SUSPENDED" || tenant.deletedAt) notFound();

  const [catalog, cart, guest] = await Promise.all([
    listCatalog(tenant.id),
    getCart(tenant.id),
    getStoreGuest(),
  ]);
  const active = guest ? await findActiveOrderForPhone(tenant.id, guest.phone) : null;
  const status = getStoreStatus(tenant.hours, new Date(), tenant.timezone);

  return (
    <StoreMenu
      slug={slug}
      tenantName={tenant.name}
      logoUrl={tenant.logoUrl}
      phone={tenant.phone}
      statusLabel={status.open ? `${status.label} · ${status.nextChange ?? ""}` : status.label}
      storeOpen={status.open}
      tableNumber={tableNumber}
      categories={catalog.categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        active: category.active,
      }))}
      products={catalog.products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        promotionalPriceCents: product.promotionalPriceCents,
        kind: product.kind,
        featured: product.featured,
        active: product.active,
        available: product.available,
        trackInventory: product.trackInventory,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId,
        sortOrder: product.sortOrder,
      }))}
      sizes={catalog.sizes.map((size) => ({
        id: size.id,
        name: size.name,
        slug: size.slug,
        maxFlavors: size.maxFlavors,
        slices: size.slices,
        basePriceCents: size.basePriceCents,
        pricingMode: size.pricingMode,
      }))}
      flavors={catalog.flavors
        .filter((flavor) => flavor.active || Boolean(flavor.description?.trim()))
        .map((flavor) => ({
        id: flavor.id,
        name: flavor.name,
        description: flavor.description,
        active: flavor.active,
        prices: flavor.prices.map((price) => ({ sizeId: price.sizeId, priceCents: price.priceCents })),
      }))}
      addonGroups={catalog.addonGroups.map((group) => ({
        id: group.id,
        name: group.name,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        addons: group.addons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          priceCents: addon.priceCents,
          active: addon.active,
        })),
      }))}
      cartItems={(cart?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      }))}
      couponCode={cart?.couponCode ?? null}
      guest={guest}
      activeOrder={
        active
          ? {
              publicCode: active.publicCode,
              trackingToken: active.trackingToken,
              status: active.status,
              fulfillment: active.fulfillment,
              estimatedMinutes: active.estimatedMinutes,
              createdAt: active.createdAt.toISOString(),
              rejected: active.rejected,
            }
          : null
      }
      zones={catalog.deliveryZones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        feeCents: zone.feeCents,
        minOrderCents: zone.minOrderCents,
      }))}
    />
  );
}
