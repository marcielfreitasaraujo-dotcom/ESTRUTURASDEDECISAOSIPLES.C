export type StockStatusInput = {
  available: boolean;
  trackInventory?: boolean;
  stockQuantity?: number | null;
};

export function isSoldOut(product: StockStatusInput): boolean {
  if (!product.available) return true;
  if (product.trackInventory && (product.stockQuantity ?? 0) <= 0) return true;
  return false;
}

export function clampStockQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, Math.floor(quantity));
}
