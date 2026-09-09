import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { quotePizza } from "@/domain/catalog/pizza-pricing";
import { calculateCheckoutTotals } from "@/domain/ordering/checkout";
import { evaluateCoupon } from "@/domain/coupons/evaluate";
import { writeAudit } from "@/server/audit";
import { getPaymentProvider } from "@/server/providers/payment";
import type { FulfillmentType, PaymentMethod, Prisma } from "@prisma/client";

const CART_COOKIE = "comanda_cart";

export async function getCart(tenantId: string) {
  const store = await cookies();
  const existingId = store.get(CART_COOKIE)?.value;
  if (!existingId) return null;
  return prisma.cart.findFirst({
    where: { id: existingId, tenantId },
    include: { items: true },
  });
}

export async function getOrCreateCart(tenantId: string) {
  const existing = await getCart(tenantId);
  if (existing) return existing;

  const cart = await prisma.cart.create({
    data: { tenantId },
    include: { items: true },
  });
  const store = await cookies();
  store.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return cart;
}

export async function addSimpleProductToCart(input: {
  tenantId: string;
  productId: string;
  quantity: number;
  notes?: string;
}) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, tenantId: input.tenantId, active: true, archived: false },
  });
  if (!product) throw new NotFoundError("Produto não encontrado.");

  const price = product.promotionalPriceCents ?? product.priceCents;
  const cart = await getOrCreateCart(input.tenantId);
  await prisma.cartItem.create({
    data: {
      tenantId: input.tenantId,
      cartId: cart.id,
      productId: product.id,
      name: product.name,
      quantity: input.quantity,
      unitPriceCents: price,
      notes: input.notes,
    },
  });
  return getOrCreateCart(input.tenantId);
}

export async function addPizzaToCart(input: {
  tenantId: string;
  sizeId: string;
  flavorIds: string[];
  crustId?: string;
  addonIds?: string[];
  notes?: string;
  quantity: number;
}) {
  const size = await prisma.pizzaSize.findFirst({
    where: { id: input.sizeId, tenantId: input.tenantId, active: true },
    include: { flavorPrices: true },
  });
  if (!size) throw new NotFoundError("Tamanho não encontrado.");

  const flavors = await prisma.pizzaFlavor.findMany({
    where: { id: { in: input.flavorIds }, tenantId: input.tenantId, active: true },
    include: { prices: true },
  });
  if (flavors.length !== input.flavorIds.length) {
    throw new NotFoundError("Um ou mais sabores são inválidos.");
  }

  const crust = input.crustId
    ? await prisma.crust.findFirst({ where: { id: input.crustId, tenantId: input.tenantId, active: true } })
    : null;
  const addons = input.addonIds?.length
    ? await prisma.addon.findMany({ where: { id: { in: input.addonIds }, tenantId: input.tenantId, active: true } })
    : [];

  const quote = quotePizza({
    sizeName: size.name,
    maxFlavors: size.maxFlavors,
    basePriceCents: size.basePriceCents,
    pricingMode: size.pricingMode,
    flavors: flavors.map((flavor) => ({
      id: flavor.id,
      name: flavor.name,
      priceCents: flavor.prices.find((price) => price.sizeId === size.id)?.priceCents ?? 0,
    })),
    crustPriceCents: crust?.priceCents ?? 0,
    addons: addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      priceCents: addon.priceCents,
      quantity: 1,
    })),
  });

  const cart = await getOrCreateCart(input.tenantId);
  const customization = {
    sizeId: size.id,
    flavorIds: input.flavorIds,
    crustId: crust?.id,
    addonIds: addons.map((addon) => addon.id),
    quote,
  } satisfies Prisma.InputJsonValue;

  await prisma.cartItem.create({
    data: {
      tenantId: input.tenantId,
      cartId: cart.id,
      name: `Pizza ${size.name} — ${quote.flavorNames.join(" / ")}`,
      quantity: input.quantity,
      unitPriceCents: quote.totalCents,
      notes: input.notes,
      customization,
    },
  });
  return getOrCreateCart(input.tenantId);
}

export async function updateCartItemQuantity(tenantId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, tenantId } });
  if (!item) throw new NotFoundError("Item não encontrado.");
  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }
  return getOrCreateCart(tenantId);
}

export async function placeOrder(input: {
  tenantId: string;
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillment: FulfillmentType;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
  street?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  reference?: string;
}) {
  const existing = await prisma.order.findUnique({
    where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
  });
  if (existing) return existing;

  const cart = await getOrCreateCart(input.tenantId);
  if (cart.items.length === 0) throw new Error("O carrinho está vazio.");

  let deliveryFeeCents = 0;
  if (input.fulfillment === "DELIVERY") {
    if (!input.neighborhood) throw new Error("Informe o bairro para entrega.");
    const zone = await prisma.deliveryZone.findFirst({
      where: {
        tenantId: input.tenantId,
        active: true,
        name: { equals: input.neighborhood, mode: "insensitive" },
      },
    });
    deliveryFeeCents = zone?.feeCents ?? 800;
  }

  const coupon = input.couponCode
    ? await prisma.coupon.findFirst({
        where: { tenantId: input.tenantId, code: input.couponCode.toUpperCase() },
      })
    : null;

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const couponResult = coupon
    ? evaluateCoupon(
        {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minSubtotalCents: coupon.minSubtotalCents,
          active: coupon.active,
          startsAt: coupon.startsAt,
          endsAt: coupon.endsAt,
          firstOrderOnly: coupon.firstOrderOnly,
        },
        {
          now: new Date(),
          subtotalCents,
          deliveryFeeCents,
          isFirstOrder: true,
        },
      )
    : { ok: true as const, discountCents: 0, deliveryFeeCents };

  if (!couponResult.ok) throw new Error(couponResult.reason);

  const totals = calculateCheckoutTotals({
    items: cart.items,
    discountCents: couponResult.discountCents,
    deliveryFeeCents: couponResult.deliveryFeeCents,
  });

  const last = await prisma.order.findFirst({
    where: { tenantId: input.tenantId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 1000) + 1;
  const publicCode = `${number.toString().padStart(4, "0")}`;
  const digits = (input.customerPhone ?? "").replace(/\D/g, "");
  const customer =
    digits.length >= 10
      ? await prisma.customer.upsert({
          where: { tenantId_phone: { tenantId: input.tenantId, phone: digits } },
          update: { name: input.customerName, email: input.customerEmail },
          create: {
            tenantId: input.tenantId,
            name: input.customerName,
            phone: digits,
            email: input.customerEmail,
          },
        })
      : null;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId: input.tenantId,
        number,
        publicCode,
        customerId: customer?.id,
        status: "PENDING",
        fulfillment: input.fulfillment,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        street: input.street,
        addressNumber: input.addressNumber,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        reference: input.reference,
        notes: input.notes,
        couponCode: coupon?.code,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        deliveryFeeCents: totals.deliveryFeeCents,
        totalCents: totals.totalCents,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "CASH" || input.paymentMethod === "PIX" ? "PENDING" : "PENDING",
        idempotencyKey: input.idempotencyKey,
        items: {
          create: cart.items.map((item) => ({
            tenantId: input.tenantId,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalCents: item.unitPriceCents * item.quantity,
            notes: item.notes,
            customization: item.customization ?? undefined,
          })),
        },
        statusHistory: {
          create: {
            tenantId: input.tenantId,
            toStatus: "PENDING",
          },
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id, tenantId: input.tenantId } });
    return created;
  });

  const payment = getPaymentProvider();
  const charged = await payment.charge({
    amountCents: order.totalCents,
    method: input.paymentMethod === "CARD" ? "CARD" : "PIX",
    idempotencyKey: input.idempotencyKey,
    metadata: { orderId: order.id, tenantId: input.tenantId },
  });

  await prisma.payment.create({
    data: {
      tenantId: input.tenantId,
      orderId: order.id,
      provider: payment.name,
      method: input.paymentMethod,
      status: charged.status,
      amountCents: order.totalCents,
      providerRef: charged.providerRef,
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      tenantId: input.tenantId,
      name: "ORDER_CREATED",
      payload: { orderId: order.id, totalCents: order.totalCents },
    },
  });

  await writeAudit({
    action: "CREATE",
    entity: "Order",
    entityId: order.id,
    tenantId: input.tenantId,
    metadata: { number: order.number, totalCents: order.totalCents },
  });

  return order;
}
