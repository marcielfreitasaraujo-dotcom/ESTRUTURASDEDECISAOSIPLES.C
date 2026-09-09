import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { ROLE_PERMISSIONS, TENANT_ROLES } from "../src/domain/rbac/roles";
import { PERMISSIONS } from "../src/domain/rbac/permissions";

const prisma = new PrismaClient();

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  platformRole: "SUPER_ADMIN" | "PLATFORM_ADMIN" | "USER";
}) {
  const password = await hashPassword(input.password);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    await prisma.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password },
    });
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: input.name, platformRole: input.platformRole, emailVerified: true },
    });
  }

  const id = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      id,
      name: input.name,
      email: input.email,
      emailVerified: true,
      platformRole: input.platformRole,
    },
  });
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password,
    },
  });
  return user;
}

async function seedPermissions() {
  for (const key of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: key },
      create: { key, description: key },
    });
  }
  const permissions = await prisma.permission.findMany();
  for (const role of TENANT_ROLES) {
    for (const key of ROLE_PERMISSIONS[role]) {
      const permission = permissions.find((item) => item.key === key);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }
}

async function seedHours(tenantId: string) {
  for (let weekday = 0; weekday < 7; weekday += 1) {
    await prisma.businessHour.upsert({
      where: { tenantId_weekday: { tenantId, weekday } },
      update: {},
      create: {
        tenantId,
        weekday,
        closed: weekday === 1,
        opensAt: "18:00",
        closesAt: "23:30",
      },
    });
  }
}

async function seedCentral(ownerId: string) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "central-da-pizza" },
    update: { status: "ACTIVE", onboardingCompletedAt: new Date(), onboardingStep: 7 },
    create: {
      slug: "central-da-pizza",
      name: "Central da Pizza",
      tradeName: "Central da Pizza",
      phone: "(11) 4000-0000",
      whatsapp: "(11) 90000-0000",
      city: "São Paulo",
      state: "SP",
      neighborhood: "Centro",
      status: "ACTIVE",
      estimatedMinutes: 40,
      minimumOrderCents: 2500,
      primaryColor: "#C2410C",
      onboardingStep: 7,
      onboardingCompletedAt: new Date(),
    },
  });

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: ownerId } },
    update: { role: "OWNER" },
    create: { tenantId: tenant.id, userId: ownerId, role: "OWNER" },
  });

  await seedHours(tenant.id);

  for (const method of ["PIX", "CASH", "CARD"] as const) {
    await prisma.tenantPaymentMethod.upsert({
      where: { tenantId_method: { tenantId: tenant.id, method } },
      update: { enabled: true },
      create: { tenantId: tenant.id, method, enabled: true },
    });
  }

  const categories = await Promise.all(
    [
      { name: "Pizzas", slug: "pizzas" },
      { name: "Bebidas", slug: "bebidas" },
      { name: "Sobremesas", slug: "sobremesas" },
      { name: "Combos", slug: "combos" },
    ].map((category, index) =>
      prisma.category.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: category.slug } },
        update: { name: category.name, sortOrder: index },
        create: { tenantId: tenant.id, ...category, sortOrder: index },
      }),
    ),
  );

  const sizes = await Promise.all(
    [
      { name: "Pequena", slug: "pequena", maxFlavors: 1, slices: 4, basePriceCents: 0, sortOrder: 1 },
      { name: "Média", slug: "media", maxFlavors: 2, slices: 6, basePriceCents: 0, sortOrder: 2 },
      { name: "Grande", slug: "grande", maxFlavors: 2, slices: 8, basePriceCents: 0, sortOrder: 3 },
      { name: "Família", slug: "familia", maxFlavors: 3, slices: 12, basePriceCents: 0, sortOrder: 4 },
    ].map((size) =>
      prisma.pizzaSize.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: size.slug } },
        update: size,
        create: { tenantId: tenant.id, ...size },
      }),
    ),
  );

  const flavorDefs = [
    { name: "Calabresa", slug: "calabresa", prices: [3990, 4990, 5990, 7990] },
    { name: "Frango com Catupiry", slug: "frango-catupiry", prices: [4490, 5490, 6490, 8490] },
    { name: "Portuguesa", slug: "portuguesa", prices: [4490, 5490, 6490, 8490] },
    { name: "Quatro Queijos", slug: "quatro-queijos", prices: [4690, 5690, 6690, 8690] },
    { name: "Margherita", slug: "margherita", prices: [3990, 4990, 5990, 7990] },
    { name: "Pepperoni", slug: "pepperoni", prices: [4790, 5790, 6790, 8790] },
  ];

  for (const [index, flavorDef] of flavorDefs.entries()) {
    const flavor = await prisma.pizzaFlavor.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: flavorDef.slug } },
      update: { name: flavorDef.name, sortOrder: index, active: true },
      create: {
        tenantId: tenant.id,
        name: flavorDef.name,
        slug: flavorDef.slug,
        sortOrder: index,
      },
    });
    for (const [sizeIndex, size] of sizes.entries()) {
      await prisma.pizzaFlavorPrice.upsert({
        where: { flavorId_sizeId: { flavorId: flavor.id, sizeId: size.id } },
        update: { priceCents: flavorDef.prices[sizeIndex] ?? 0 },
        create: {
          tenantId: tenant.id,
          flavorId: flavor.id,
          sizeId: size.id,
          priceCents: flavorDef.prices[sizeIndex] ?? 0,
        },
      });
    }
  }

  const crusts = [
    { name: "Tradicional", priceCents: 0 },
    { name: "Catupiry", priceCents: 900 },
    { name: "Cheddar", priceCents: 900 },
    { name: "Chocolate", priceCents: 1200 },
  ];
  for (const [index, crust] of crusts.entries()) {
    await prisma.crust.create({
      data: { tenantId: tenant.id, ...crust, sortOrder: index },
    }).catch(() => undefined);
  }

  const extras = await prisma.addonGroup.create({
    data: {
      tenantId: tenant.id,
      name: "Extras",
      required: false,
      minSelect: 0,
      maxSelect: 4,
      addons: {
        create: [
          { tenantId: tenant.id, name: "Bacon", priceCents: 600 },
          { tenantId: tenant.id, name: "Queijo extra", priceCents: 500 },
          { tenantId: tenant.id, name: "Milho", priceCents: 300 },
          { tenantId: tenant.id, name: "Calabresa extra", priceCents: 500 },
        ],
      },
    },
  }).catch(() => prisma.addonGroup.findFirst({ where: { tenantId: tenant.id, name: "Extras" } }));

  const pizzaCategory = categories[0];
  const drinksCategory = categories[1];
  const dessertCategory = categories[2];
  const comboCategory = categories[3];

  const products: Prisma.ProductCreateManyInput[] = [
    {
      tenantId: tenant.id,
      categoryId: pizzaCategory?.id,
      kind: "PIZZA",
      name: "Monte sua pizza",
      slug: "monte-sua-pizza",
      description: "Escolha tamanho, sabores, borda e extras. O preço é calculado no servidor.",
      priceCents: 0,
      featured: true,
      sortOrder: 0,
    },
    {
      tenantId: tenant.id,
      categoryId: drinksCategory?.id,
      kind: "BEVERAGE",
      name: "Coca-Cola 2L",
      slug: "coca-cola-2l",
      description: "Refrigerante gelado 2 litros.",
      priceCents: 1400,
      sortOrder: 1,
    },
    {
      tenantId: tenant.id,
      categoryId: drinksCategory?.id,
      kind: "BEVERAGE",
      name: "Guaraná Antarctica 2L",
      slug: "guarana-2l",
      priceCents: 1200,
      sortOrder: 2,
    },
    {
      tenantId: tenant.id,
      categoryId: dessertCategory?.id,
      kind: "SIMPLE",
      name: "Brownie com sorvete",
      slug: "brownie",
      priceCents: 1800,
      sortOrder: 3,
    },
    {
      tenantId: tenant.id,
      categoryId: comboCategory?.id,
      kind: "COMBO",
      name: "Combo Família",
      slug: "combo-familia",
      description: "Pizza família + refrigerante 2L + brownie.",
      priceCents: 9990,
      promotionalPriceCents: 8990,
      featured: true,
      sortOrder: 4,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: product.slug } },
      update: product,
      create: product,
    });
  }

  await prisma.deliveryZone.createMany({
    data: [
      { tenantId: tenant.id, name: "Centro", feeCents: 500, minOrderCents: 2500 },
      { tenantId: tenant.id, name: "Vila Nova", feeCents: 700, minOrderCents: 3000 },
      { tenantId: tenant.id, name: "São João", feeCents: 800, minOrderCents: 3000 },
    ],
    skipDuplicates: true,
  });

  await prisma.coupon.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "BEMVINDO10" } },
    update: { active: true, type: "PERCENTAGE", value: 10, minSubtotalCents: 4000 },
    create: {
      tenantId: tenant.id,
      code: "BEMVINDO10",
      type: "PERCENTAGE",
      value: 10,
      minSubtotalCents: 4000,
      firstOrderOnly: true,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: "11988887777" } },
    update: { name: "Ana Souza" },
    create: {
      tenantId: tenant.id,
      name: "Ana Souza",
      phone: "11988887777",
      email: "ana@example.com",
    },
  });

  const existingOrder = await prisma.order.findFirst({ where: { tenantId: tenant.id, number: 1042 } });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        tenantId: tenant.id,
        number: 1042,
        publicCode: "1042",
        customerId: customer.id,
        status: "PREPARING",
        fulfillment: "DELIVERY",
        customerName: customer.name,
        customerPhone: customer.phone,
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        subtotalCents: 7390,
        deliveryFeeCents: 500,
        totalCents: 7890,
        paymentMethod: "PIX",
        paymentStatus: "PAID",
        idempotencyKey: "seed-order-1042",
        notes: "Pouco queijo",
        items: {
          create: [
            {
              tenantId: tenant.id,
              name: "Pizza Grande — Calabresa / Frango com Catupiry",
              quantity: 1,
              unitPriceCents: 6490,
              totalCents: 6490,
              notes: "Pouco queijo",
              customization: {
                flavors: ["Calabresa", "Frango com Catupiry"],
                crust: "Catupiry",
              },
            },
            {
              tenantId: tenant.id,
              name: "Coca-Cola 2L",
              quantity: 1,
              unitPriceCents: 1400,
              totalCents: 1400,
            },
          ],
        },
        statusHistory: {
          create: [
            { tenantId: tenant.id, toStatus: "PENDING" },
            { tenantId: tenant.id, fromStatus: "PENDING", toStatus: "CONFIRMED" },
            { tenantId: tenant.id, fromStatus: "CONFIRMED", toStatus: "PREPARING" },
          ],
        },
      },
    });
  }

  void extras;
  return tenant;
}

async function seedSecondTenant(ownerId: string) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "pizzaria-teste" },
    update: { status: "ACTIVE" },
    create: {
      slug: "pizzaria-teste",
      name: "Pizzaria Teste",
      status: "ACTIVE",
      city: "Campinas",
      state: "SP",
      onboardingCompletedAt: new Date(),
    },
  });
  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: ownerId } },
    update: {},
    create: { tenantId: tenant.id, userId: ownerId, role: "OWNER" },
  });
  await prisma.product.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "pizza-secreta" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Pizza secreta do tenant B",
      slug: "pizza-secreta",
      priceCents: 9999,
      kind: "SIMPLE",
    },
  });
  return tenant;
}

async function main() {
  await seedPermissions();

  const superAdmin = await upsertUser({
    name: "Super Admin Forno",
    email: "xavier.y@example.org",
    password: "FornoAdmin!2026",
    platformRole: "SUPER_ADMIN",
  });
  const owner = await upsertUser({
    name: "Márcia Oliveira",
    email: "maria.s@example.com",
    password: "CentralPizza!2026",
    platformRole: "USER",
  });
  const otherOwner = await upsertUser({
    name: "Carlos Teste",
    email: "wendy.h@example.net",
    password: "PizzariaTeste!2026",
    platformRole: "USER",
  });

  const starter = await prisma.plan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter",
      description: "Pedidos, cardápio e KDS.",
      monthlyPriceCents: 18900,
      yearlyPriceCents: 181440,
    },
  });

  const central = await seedCentral(owner.id);
  await seedSecondTenant(otherOwner.id);

  await prisma.subscription.upsert({
    where: { tenantId: central.id },
    update: { status: "TRIAL", planId: starter.id },
    create: {
      tenantId: central.id,
      planId: starter.id,
      status: "TRIAL",
      interval: "MONTHLY",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.featureFlag.upsert({
    where: { key_scope_scopeId: { key: "enable_kds", scope: "PLATFORM", scopeId: "platform" } },
    update: { enabled: true },
    create: { key: "enable_kds", scope: "PLATFORM", scopeId: "platform", enabled: true },
  });

  console.log("Seed ok");
  console.log(`super admin: ${superAdmin.email}`);
  console.log(`owner: ${owner.email}`);
  console.log(`tenant B: ${otherOwner.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
