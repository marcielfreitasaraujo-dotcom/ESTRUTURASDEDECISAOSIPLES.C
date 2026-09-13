export const LOYALTY_POINTS_PER_REAL = 15;

export function loyaltyPointsForPrice(priceCents: number): number {
  return Math.round(priceCents / 100) * LOYALTY_POINTS_PER_REAL;
}

export function loyaltyRedeemHint(points: number): string {
  return `Resgate a partir de ${points} pontos`;
}
