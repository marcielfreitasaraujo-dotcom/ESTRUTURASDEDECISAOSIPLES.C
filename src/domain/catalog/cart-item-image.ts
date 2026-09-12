import { pizzaProductSlug } from "@/domain/catalog/central-menu";

export type CartImageCatalogProduct = {
  name: string;
  slug: string;
  imageUrl: string | null;
};

export function cartCustomizationImageUrl(customization: unknown): string | null {
  if (!customization || typeof customization !== "object") return null;
  const imageUrl = (customization as { imageUrl?: unknown }).imageUrl;
  return typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : null;
}

export function pizzaSizeSlugFromCartName(name: string): string | null {
  const match = name.match(/^Pizza\s+(P|M|G|GG)\b/i);
  return match ? match[1].toLowerCase() : null;
}

export function pizzaSizeSlugFromCartItem(item: {
  name: string;
  customization?: unknown;
}): string | null {
  if (item.customization && typeof item.customization === "object") {
    const slug = (item.customization as { sizeSlug?: unknown }).sizeSlug;
    if (typeof slug === "string" && slug.trim()) return slug.trim().toLowerCase();
  }
  return pizzaSizeSlugFromCartName(item.name);
}

export function resolveCartItemImage(
  item: { name: string; imageUrl?: string | null; customization?: unknown },
  products: CartImageCatalogProduct[],
): string | null {
  if (item.imageUrl) return item.imageUrl;

  const snapshot = cartCustomizationImageUrl(item.customization);
  if (snapshot) return snapshot;

  const exact = products.find((product) => product.name === item.name && product.imageUrl);
  if (exact?.imageUrl) return exact.imageUrl;

  const sizeSlug = pizzaSizeSlugFromCartItem(item);
  if (sizeSlug) {
    const pizzaSlug = pizzaProductSlug(sizeSlug);
    const pizza = products.find((product) => product.slug === pizzaSlug && product.imageUrl);
    if (pizza?.imageUrl) return pizza.imageUrl;
  }

  const needle = normalizeCartLabel(item.name);
  const partial = products.find((product) => {
    if (!product.imageUrl) return false;
    const productName = normalizeCartLabel(product.name);
    return needle === productName || needle.includes(productName);
  });
  return partial?.imageUrl ?? null;
}

function normalizeCartLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
