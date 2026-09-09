import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";
import { assertTenantId, createTenantPrisma } from "@/server/tenancy";
import { assertNoCrossTenantOrderAccess } from "@/server/services/orders";

const prisma = new PrismaClient();

describe("isolamento multi-tenant", () => {
  let tenantA: string;
  let tenantB: string;
  let productB: string;
  let orderB: string;

  beforeAll(async () => {
    const a = await prisma.tenant.findUnique({ where: { slug: "central-da-pizza" } });
    const b = await prisma.tenant.findUnique({ where: { slug: "pizzaria-teste" } });
    const secret = await prisma.product.findFirst({
      where: { slug: "pizza-secreta", tenantId: b?.id },
    });
    const order = await prisma.order.findFirst({ where: { tenantId: b?.id } });
    if (!a || !b || !secret) {
      throw new Error("Seed incompleto: rode npm run db:seed");
    }
    tenantA = a.id;
    tenantB = b.id;
    productB = secret.id;
    if (!order) {
      const created = await prisma.order.create({
        data: {
          tenantId: tenantB,
          number: 1,
          publicCode: "0001",
          status: "PENDING",
          fulfillment: "PICKUP",
          customerName: "B",
          customerPhone: "000",
          subtotalCents: 1000,
          totalCents: 1000,
          paymentMethod: "PIX",
          idempotencyKey: "iso-b-1",
        },
      });
      orderB = created.id;
    } else {
      orderB = order.id;
    }
  });

  it("Tenant A não lê produto do Tenant B mesmo conhecendo o id", async () => {
    const leaked = await prisma.product.findFirst({
      where: { id: productB, tenantId: tenantA },
    });
    expect(leaked).toBeNull();
  });

  it("o client tenant-aware esconde o catálogo do outro estabelecimento", async () => {
    const dbA = createTenantPrisma(tenantA);
    const leaked = await dbA.product.findMany({
      where: { slug: "pizza-secreta" },
    });
    expect(leaked).toHaveLength(0);
    const own = await createTenantPrisma(tenantB).product.findMany({
      where: { slug: "pizza-secreta" },
    });
    expect(own).toHaveLength(1);
  });

  it("assertTenantId recusa cruzamento", () => {
    expect(() => assertTenantId(tenantB, tenantA)).toThrow(ForbiddenError);
    expect(() => assertTenantId(tenantB, tenantA)).toThrow(/Tenant A não pode acessar Tenant B/);
  });

  it("pedido do Tenant B é inacessível ao Tenant A", async () => {
    await expect(assertNoCrossTenantOrderAccess(tenantA, orderB)).rejects.toThrow(ForbiddenError);
  });
});
