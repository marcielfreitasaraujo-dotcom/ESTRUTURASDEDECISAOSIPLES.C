import { prisma } from "@/lib/db";
import { clampStockQuantity } from "@/domain/catalog/stock";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listCatalog(tenantId: string) {
  const [categories, products, sizes, flavors, crusts, addonGroups, deliveryZones] = await Promise.all([
    prisma.category.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, archived: false },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    }),
    prisma.pizzaSize.findMany({ where: { tenantId, active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.pizzaFlavor.findMany({
      where: { tenantId },
      include: { prices: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.crust.findMany({ where: { tenantId, active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.addonGroup.findMany({
      where: { tenantId },
      include: { addons: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.deliveryZone.findMany({ where: { tenantId, active: true }, orderBy: { name: "asc" } }),
  ]);
  return { categories, products, sizes, flavors, crusts, addonGroups, deliveryZones };
}

export async function upsertCategory(input: {
  tenantId: string;
  userId?: string;
  id?: string;
  name: string;
  description?: string;
  active?: boolean;
}) {
  const slug = slugify(input.name);
  if (input.id) {
    const existing = await prisma.category.findFirst({ where: { id: input.id, tenantId: input.tenantId } });
    if (!existing) throw new NotFoundError("Categoria não encontrada.");
    return prisma.category.update({
      where: { id: existing.id },
      data: { name: input.name, slug, description: input.description, active: input.active ?? existing.active },
    });
  }
  try {
    const created = await prisma.category.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        slug,
        description: input.description,
        active: input.active ?? true,
      },
    });
    await writeAudit({
      action: "CREATE",
      entity: "Category",
      entityId: created.id,
      tenantId: input.tenantId,
      userId: input.userId,
    });
    return created;
  } catch {
    throw new ConflictError("Já existe uma categoria com esse nome.");
  }
}

export async function upsertProduct(input: {
  tenantId: string;
  userId?: string;
  id?: string;
  name: string;
  description?: string;
  categoryId?: string;
  priceCents: number;
  promotionalPriceCents?: number | null;
  kind?: "SIMPLE" | "PIZZA" | "COMBO" | "BEVERAGE" | "OTHER";
  active?: boolean;
  featured?: boolean;
}) {
  const slug = slugify(input.name);
  if (input.id) {
    const existing = await prisma.product.findFirst({ where: { id: input.id, tenantId: input.tenantId } });
    if (!existing) throw new NotFoundError("Produto não encontrado.");
    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        categoryId: input.categoryId,
        priceCents: input.priceCents,
        promotionalPriceCents: input.promotionalPriceCents,
        kind: input.kind,
        active: input.active,
        featured: input.featured,
      },
    });
    if (existing.priceCents !== input.priceCents) {
      await writeAudit({
        action: "PRICE_CHANGE",
        entity: "Product",
        entityId: existing.id,
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: { from: existing.priceCents, to: input.priceCents },
      });
    }
    return updated;
  }

  return prisma.product.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      slug,
      description: input.description,
      categoryId: input.categoryId,
      priceCents: input.priceCents,
      promotionalPriceCents: input.promotionalPriceCents,
      kind: input.kind ?? "SIMPLE",
      active: input.active ?? true,
      featured: input.featured ?? false,
    },
  });
}

export async function duplicateProduct(tenantId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
  if (!product) throw new NotFoundError("Produto não encontrado.");
  return prisma.product.create({
    data: {
      tenantId,
      categoryId: product.categoryId,
      kind: product.kind,
      name: `${product.name} (cópia)`,
      slug: `${product.slug}-copia-${Date.now()}`,
      description: product.description,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
      promotionalPriceCents: product.promotionalPriceCents,
      sku: product.sku ? `${product.sku}-COPY` : null,
      active: false,
      featured: false,
    },
  });
}

export async function setProductStock(input: {
  tenantId: string;
  productId: string;
  quantity: number;
  userId?: string | null;
}) {
  const stockQuantity = clampStockQuantity(input.quantity);
  const product = await prisma.product.findFirst({
    where: { id: input.productId, tenantId: input.tenantId, deletedAt: null },
  });
  if (!product) throw new NotFoundError("Produto não encontrado.");

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      stockQuantity,
      trackInventory: true,
      available: stockQuantity > 0,
    },
  });

  await writeAudit({
    action: "UPDATE",
    entity: "Product",
    entityId: product.id,
    tenantId: input.tenantId,
    userId: input.userId,
    metadata: {
      field: "stock",
      from: product.stockQuantity,
      to: stockQuantity,
      available: updated.available,
    },
  });

  return updated;
}
