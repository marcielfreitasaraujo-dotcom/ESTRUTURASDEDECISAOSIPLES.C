"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { updateCartItemAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatBRL } from "@/lib/money";

export type StoreCartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export function StoreCartButton({
  itemCount,
  onClick,
}: {
  itemCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full border bg-white text-zinc-800 shadow-sm hover:bg-zinc-50"
      aria-label={itemCount === 0 ? "Abrir carrinho" : `Abrir carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
    >
      <ShoppingBag className="size-5" />
      <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-bold leading-5 text-primary-foreground">
        {itemCount}
      </span>
    </button>
  );
}

export function StoreCartSheet({
  open,
  onOpenChange,
  slug,
  tableQuery,
  items,
  storeOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  tableQuery: string;
  items: StoreCartItem[];
  storeOpen: boolean;
}) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const checkoutHref = `/loja/${slug}/checkout${tableQuery}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Carrinho</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Escolha no cardápio. Os itens entram aqui."
              : `${itemCount} ${itemCount === 1 ? "item" : "itens"} selecionados`}
          </SheetDescription>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="grid flex-1 place-items-center gap-2 px-6 text-center text-zinc-400">
            <ShoppingBag className="size-12" />
            <p>Seu carrinho está vazio</p>
          </div>
        ) : (
          <ul className="grid flex-1 content-start gap-3 overflow-y-auto px-4 py-4">
            {items.map((item) => (
              <CartRow key={item.id} slug={slug} item={item} />
            ))}
          </ul>
        )}

        <SheetFooter className="border-t bg-white">
          {itemCount > 0 ? (
            <p className="flex justify-between text-base font-medium">
              <span>Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </p>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Continuar escolhendo
          </Button>
          {storeOpen ? (
            itemCount === 0 ? (
              <Button type="button" disabled className="h-11">
                Finalizar pedido
              </Button>
            ) : (
              <Button asChild className="h-11">
                <Link href={checkoutHref}>Finalizar pedido</Link>
              </Button>
            )
          ) : (
            <Button type="button" disabled className="h-11 bg-zinc-700 text-white disabled:opacity-100">
              Estabelecimento fechado
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CartRow({ slug, item }: { slug: string; item: StoreCartItem }) {
  const [pending, startTransition] = useTransition();

  function setQuantity(quantity: number) {
    startTransition(async () => {
      await updateCartItemAction(slug, item.id, quantity);
    });
  }

  return (
    <li className="rounded-2xl border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{item.name}</p>
          <p className="mt-1 text-sm text-zinc-500">{formatBRL(item.unitPriceCents * item.quantity)}</p>
        </div>
        <button
          type="button"
          className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label={`Remover ${item.name}`}
          disabled={pending}
          onClick={() => setQuantity(0)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full border"
          aria-label="Diminuir quantidade"
          disabled={pending}
          onClick={() => setQuantity(item.quantity - 1)}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full border"
          aria-label="Aumentar quantidade"
          disabled={pending}
          onClick={() => setQuantity(item.quantity + 1)}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
