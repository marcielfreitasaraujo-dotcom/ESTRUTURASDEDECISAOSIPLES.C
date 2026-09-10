"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, Gift, MapPin, Ticket } from "lucide-react";
import { addProductToCartAction, applyCartCouponAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBRL } from "@/lib/money";
import { loyaltyPointsForPrice, loyaltyRedeemHint } from "@/domain/catalog/loyalty";
import { PizzaCustomizeDialog, type StoreAddonGroup, type StoreFlavor, type StoreSize } from "@/components/pizza-builder";
import { pizzaProductSlug } from "@/domain/catalog/central-menu";
import { isSoldOut } from "@/domain/catalog/stock";
import { StoreCartButton, StoreCartSheet } from "@/components/storefront/store-cart";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  promotionalPriceCents: number | null;
  kind: string;
  featured: boolean;
  active: boolean;
  available: boolean;
  trackInventory: boolean;
  stockQuantity: number | null;
  categoryId: string | null;
  sortOrder: number;
};

type Category = { id: string; name: string; slug: string; active: boolean };
type CartItem = { id: string; name: string; quantity: number; unitPriceCents: number };
type Zone = { id: string; name: string; feeCents: number; minOrderCents: number };

const PRODUCT_BADGE: Record<string, string> = {
  "pizza-m": "RECOMENDADO",
  "pizza-gg": "RECOMENDADO",
  "coca-cola-2l": "MAIS PEDIDO",
};

export function StoreMenu({
  slug,
  tenantName,
  logoUrl,
  phone,
  statusLabel,
  storeOpen,
  tableNumber,
  categories,
  products,
  sizes,
  flavors,
  addonGroups,
  cartItems,
  couponCode,
  zones,
}: {
  slug: string;
  tenantName: string;
  logoUrl: string | null;
  phone: string | null;
  statusLabel: string;
  storeOpen: boolean;
  tableNumber: string;
  categories: Category[];
  products: Product[];
  sizes: StoreSize[];
  flavors: StoreFlavor[];
  addonGroups: StoreAddonGroup[];
  cartItems: CartItem[];
  couponCode: string | null;
  zones: Zone[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug ?? "pizzas");
  const [pizzaSize, setPizzaSize] = useState<StoreSize | null>(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const query = tableNumber ? `?mesa=${encodeURIComponent(tableNumber)}` : "";
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  const visibleCategories = categories.filter((category) => category.active);
  const visibleProducts = products.filter((product) => product.active);

  const pizzaStock = useMemo(() => {
    const stock = new Map<string, number | null>();
    for (const product of products) {
      const sizeSlug = product.slug.replace(/^pizza-/, "");
      if (product.kind === "PIZZA") stock.set(sizeSlug, product.stockQuantity);
    }
    return stock;
  }, [products]);

  function openPizza(product: Product) {
    if (isSoldOut(product)) return;
    const sizeSlug = product.slug.replace(/^pizza-/, "");
    const size = sizes.find((item) => item.slug === sizeSlug || pizzaProductSlug(item.slug) === product.slug);
    if (size) setPizzaSize(size);
  }

  return (
    <div className="min-h-screen bg-[#eef1f4] text-zinc-900">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={tenantName} width={48} height={48} className="size-12 rounded-full border object-cover" />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">{statusLabel}</p>
            <h1 className="truncate font-heading text-lg leading-tight">{tenantName}</h1>
            {phone ? <p className="text-xs text-zinc-500">{phone}</p> : null}
          </div>
          <StoreCartButton itemCount={itemCount} onClick={() => setCartOpen(true)} />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveCategory(category.slug);
                document.getElementById(`cat-${category.slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                activeCategory === category.slug ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-8">
          {visibleCategories.map((category) => {
            const items = visibleProducts
              .filter((product) => product.categoryId === category.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            if (items.length === 0) return null;
            return (
              <section key={category.id} id={`cat-${category.slug}`} className="grid gap-3">
                <h2 className="font-heading text-2xl">{category.name}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      slug={slug}
                      product={product}
                      badge={PRODUCT_BADGE[product.slug]}
                      onPizza={() => openPizza(product)}
                      onAddedToCart={() => setCartOpen(true)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="grid h-fit gap-3 lg:sticky lg:top-4">
          <button
            type="button"
            onClick={() => setDeliveryOpen(true)}
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm"
          >
            <span className="flex items-center gap-3 text-sm">
              <MapPin className="size-4 text-zinc-500" />
              Calcular taxa e tempo de entrega
            </span>
            <ChevronRight className="size-4 text-zinc-400" />
          </button>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-600">
              {itemCount === 0
                ? "Toque no carrinho no canto superior direito. Os itens escolhidos entram lá."
                : `${itemCount} ${itemCount === 1 ? "item" : "itens"} no carrinho · ${formatBRL(subtotal)}`}
            </p>
            <Button type="button" className="mt-3 w-full" variant="outline" onClick={() => setCartOpen(true)}>
              {itemCount === 0 ? "Abrir carrinho" : "Ver carrinho"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setCouponOpen(true)}
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm"
          >
            <span className="flex items-center gap-3 text-sm">
              <Ticket className="size-4 text-zinc-500" />
              <span>
                <span className="block font-medium">{couponCode ? couponCode : "Tem um cupom?"}</span>
                <span className="text-xs text-zinc-500">
                  {couponCode ? "Cupom aplicado no carrinho" : "Clique e insira o código"}
                </span>
              </span>
            </span>
            <ChevronRight className="size-4 text-zinc-400" />
          </button>

          {storeOpen ? (
            <Button
              type="button"
              className="h-11 w-full"
              disabled={itemCount === 0}
              onClick={() => setCartOpen(true)}
            >
              {itemCount === 0 ? "Carrinho vazio" : "Finalizar pedido"}
            </Button>
          ) : (
            <Button type="button" disabled className="h-11 w-full bg-zinc-700 text-white disabled:opacity-100">
              Estabelecimento fechado
            </Button>
          )}
        </aside>
      </div>

      <PizzaCustomizeDialog
        open={Boolean(pizzaSize)}
        onOpenChange={(open) => {
          if (!open) setPizzaSize(null);
        }}
        onAdded={() => setCartOpen(true)}
        slug={slug}
        size={pizzaSize}
        flavors={flavors}
        addonGroups={addonGroups}
        stockQuantity={pizzaSize ? pizzaStock.get(pizzaSize.slug) : null}
        soldOut={
          pizzaSize
            ? products.some(
                (product) =>
                  product.kind === "PIZZA" &&
                  (product.slug === pizzaProductSlug(pizzaSize.slug) || product.slug === `pizza-${pizzaSize.slug}`) &&
                  isSoldOut(product),
              )
            : false
        }
      />

      <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Taxa e tempo de entrega</DialogTitle>
            <DialogDescription>Valores por bairro. O tempo médio aparece no topo da loja.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2">
            {zones.map((zone) => (
              <li key={zone.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <span>
                  {zone.name}
                  {zone.minOrderCents ? (
                    <span className="block text-xs text-muted-foreground">
                      pedido mínimo {formatBRL(zone.minOrderCents)}
                    </span>
                  ) : null}
                </span>
                <span className="font-medium">{formatBRL(zone.feeCents)}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <CouponDialog slug={slug} open={couponOpen} onOpenChange={setCouponOpen} current={couponCode} />
      <StoreCartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        slug={slug}
        tableQuery={query}
        items={cartItems}
        storeOpen={storeOpen}
      />
    </div>
  );
}

function SoldOutRibbon() {
  return (
    <span
      className="pointer-events-none absolute top-4 -right-8 z-20 w-[148px] rotate-45 bg-zinc-950 py-1 text-center text-[11px] font-extrabold tracking-wider text-white uppercase shadow-sm"
      aria-hidden
    >
      Esgotado
    </span>
  );
}

function ProductCard({
  slug,
  product,
  badge,
  onPizza,
  onAddedToCart,
}: {
  slug: string;
  product: Product;
  badge?: string;
  onPizza: () => void;
  onAddedToCart: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isPizza = product.kind === "PIZZA";
  const soldOut = isSoldOut(product);
  const points = loyaltyPointsForPrice(product.priceCents);
  const price = product.promotionalPriceCents ?? product.priceCents;

  function addDrink() {
    if (soldOut) return;
    startTransition(async () => {
      await addProductToCartAction(slug, product.id, 1);
      onAddedToCart();
    });
  }

  function select() {
    if (soldOut) return;
    if (isPizza) onPizza();
    else addDrink();
  }

  return (
    <article
      className="relative flex min-h-[168px] overflow-hidden rounded-2xl bg-white p-4 shadow-sm"
      aria-disabled={soldOut}
    >
      {badge && !soldOut ? (
        <span
          className={`absolute top-3 left-3 z-10 rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${
            badge === "MAIS PEDIDO" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-700"
          }`}
        >
          {badge}
        </span>
      ) : null}
      {soldOut ? (
        <div className="flex min-w-0 flex-1 flex-col items-start text-left">
          <h3 className="font-medium">{product.name}</h3>
          {product.description ? <p className="mt-1 text-sm text-zinc-500">{product.description}</p> : null}
          <p className="mt-auto pt-4 text-sm font-medium">{formatBRL(price)}</p>
        </div>
      ) : (
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start text-left"
          onClick={select}
        >
          <h3 className={`font-medium ${badge ? "mt-5" : ""}`}>{product.name}</h3>
          {product.description ? <p className="mt-1 text-sm text-zinc-500">{product.description}</p> : null}
          <p className="mt-auto pt-4 text-sm font-medium">{pending ? "Adicionando..." : formatBRL(price)}</p>
        </button>
      )}
      <div
        className={`relative ml-3 size-[128px] shrink-0 overflow-hidden ${soldOut ? "" : "cursor-pointer"}`}
        onClick={select}
      >
        {isPizza ? (
          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={(event) => event.stopPropagation()}
              className="absolute top-0 right-0 z-10 rounded-full bg-white/90 p-1.5 text-primary shadow-sm"
              aria-label="Fidelidade"
            >
              <Gift className="size-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-left leading-relaxed">
              <p className="font-medium">{loyaltyRedeemHint(points)}</p>
              <p>Adicione à sacola e, ao fechar o pedido, você poderá solicitar o resgate.</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} width={128} height={128} className="size-[128px] object-contain" />
        ) : null}
        {soldOut ? <SoldOutRibbon /> : null}
      </div>
      {soldOut ? <span className="sr-only">Esgotado</span> : null}
    </article>
  );
}

function CouponDialog({
  slug,
  open,
  onOpenChange,
  current,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await applyCartCouponAction(slug, String(formData.get("couponCode") || ""));
        setMessage(result.message);
        if (result.ok) onOpenChange(false);
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Cupom inválido.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cupom</DialogTitle>
          <DialogDescription>O desconto entra no fechamento do pedido.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-3">
          <Input name="couponCode" placeholder="BEMVINDO10" defaultValue={current ?? ""} required className="h-11" />
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Validando..." : "Aplicar cupom"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
