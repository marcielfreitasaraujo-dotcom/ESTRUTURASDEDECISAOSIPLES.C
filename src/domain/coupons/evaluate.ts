import { assertCents, percentOf, type Cents } from "@/lib/money";

export type CouponType = "PERCENTAGE" | "FIXED" | "FREE_DELIVERY" | "PRODUCT_DISCOUNT";

export type CouponDefinition = {
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents: Cents;
  active: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  firstOrderOnly: boolean;
};

export type CouponContext = {
  now: Date;
  subtotalCents: Cents;
  deliveryFeeCents: Cents;
  isFirstOrder: boolean;
};

export type CouponResult =
  | { ok: true; discountCents: Cents; deliveryFeeCents: Cents }
  | { ok: false; reason: string };

export function evaluateCoupon(coupon: CouponDefinition, context: CouponContext): CouponResult {
  if (!coupon.active) return { ok: false, reason: "Este cupom não está ativo." };
  if (coupon.startsAt && context.now < coupon.startsAt) {
    return { ok: false, reason: "Este cupom ainda não começou." };
  }
  if (coupon.endsAt && context.now > coupon.endsAt) {
    return { ok: false, reason: "Este cupom expirou." };
  }
  if (coupon.firstOrderOnly && !context.isFirstOrder) {
    return { ok: false, reason: "Este cupom vale somente na primeira compra." };
  }
  if (context.subtotalCents < coupon.minSubtotalCents) {
    return { ok: false, reason: "O pedido não atingiu o valor mínimo do cupom." };
  }

  const subtotal = assertCents(context.subtotalCents, "subtotal");
  const delivery = assertCents(context.deliveryFeeCents, "taxa de entrega");

  if (coupon.type === "PERCENTAGE") {
    return { ok: true, discountCents: percentOf(subtotal, coupon.value), deliveryFeeCents: delivery };
  }
  if (coupon.type === "FIXED") {
    return { ok: true, discountCents: Math.min(subtotal, coupon.value), deliveryFeeCents: delivery };
  }
  if (coupon.type === "FREE_DELIVERY") {
    return { ok: true, discountCents: 0, deliveryFeeCents: 0 };
  }
  return { ok: true, discountCents: Math.min(subtotal, coupon.value), deliveryFeeCents: delivery };
}
