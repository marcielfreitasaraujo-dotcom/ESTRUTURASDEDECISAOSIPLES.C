"use client";

import { useMemo, useState, useTransition } from "react";
import { Gift } from "lucide-react";
import { addPizzaToCartAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBRL } from "@/lib/money";
import { quotePizza } from "@/domain/catalog/pizza-pricing";
import { loyaltyPointsForPrice, loyaltyRedeemHint } from "@/domain/catalog/loyalty";
import { PIZZA_MIN_FLAVORS, PIZZA_NOTES_MAX } from "@/domain/catalog/central-menu";

export type StoreSize = {
  id: string;
  name: string;
  slug: string;
  maxFlavors: number;
  slices: number;
  basePriceCents: number;
  pricingMode: "HIGHEST_FLAVOR" | "AVERAGE_FLAVOR" | "SUM_FLAVORS";
};

export type StoreFlavor = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  prices: { sizeId: string; priceCents: number }[];
};

export type StoreAddon = {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
};

export type StoreAddonGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: StoreAddon[];
};

export function PizzaCustomizeDialog({
  open,
  onOpenChange,
  slug,
  size,
  flavors,
  addonGroups,
  stockQuantity,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  size: StoreSize | null;
  flavors: StoreFlavor[];
  addonGroups: StoreAddonGroup[];
  stockQuantity?: number | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        {size ? (
          <PizzaCustomizeForm
            slug={slug}
            size={size}
            flavors={flavors}
            addonGroups={addonGroups}
            stockQuantity={stockQuantity}
            onAdded={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PizzaCustomizeForm({
  slug,
  size,
  flavors,
  addonGroups,
  stockQuantity,
  onAdded,
}: {
  slug: string;
  size: StoreSize;
  flavors: StoreFlavor[];
  addonGroups: StoreAddonGroup[];
  stockQuantity?: number | null;
  onAdded: () => void;
}) {
  const [flavorIds, setFlavorIds] = useState<string[]>([]);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedFlavors = flavors.filter((flavor) => flavorIds.includes(flavor.id));
  const selectedAddons = addonGroups.flatMap((group) => group.addons).filter((addon) => addonIds.includes(addon.id));
  const maxAddons = addonGroups[0]?.maxSelect ?? 5;
  const extraByFlavor = (flavor: StoreFlavor) =>
    flavor.prices.find((price) => price.sizeId === size.id)?.priceCents ?? 0;

  const preview = useMemo(() => {
    if (selectedFlavors.length === 0) {
      return { totalCents: size.basePriceCents };
    }
    try {
      return quotePizza({
        sizeName: size.name,
        maxFlavors: size.maxFlavors,
        basePriceCents: size.basePriceCents,
        pricingMode: size.pricingMode,
        flavors: selectedFlavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          priceCents: extraByFlavor(flavor),
        })),
        addons: selectedAddons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          priceCents: addon.priceCents,
          quantity: 1,
        })),
      });
    } catch {
      return { totalCents: size.basePriceCents };
    }
  }, [size, selectedFlavors, selectedAddons]);

  const points = loyaltyPointsForPrice(size.basePriceCents);
  const flavorMet = flavorIds.length >= PIZZA_MIN_FLAVORS;
  const lowStock =
    typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 3 ? stockQuantity : null;

  function toggle(list: string[], id: string, max: number) {
    if (list.includes(id)) return list.filter((item) => item !== id);
    if (list.length >= max) return list;
    return [...list, id];
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await addPizzaToCartAction(formData);
        onAdded();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível adicionar.");
      }
    });
  }

  return (
    <form action={submit} className="grid">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="quantity" value="1" />
      <input type="hidden" name="sizeId" value={size.id} />
      <DialogHeader className="gap-1 border-b px-5 py-4">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div>
            <DialogTitle className="font-heading text-xl">Pizza {size.name}</DialogTitle>
            <DialogDescription>
              {size.slices} fatias · {formatBRL(size.basePriceCents)}
            </DialogDescription>
          </div>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="rounded-full border bg-background p-2 text-primary shadow-sm"
              aria-label="Fidelidade"
            >
              <Gift className="size-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-left leading-relaxed">
              <p className="font-medium">{loyaltyRedeemHint(points)}</p>
              <p>
                Se deseja resgatar este produto, adicione-o à sacola e ao fechar o pedido você poderá solicitar o
                resgate.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </DialogHeader>

      <section className="grid gap-3 px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-medium">Sabores</h3>
            <p className="text-xs text-muted-foreground">
              Escolha de {PIZZA_MIN_FLAVORS} a {size.maxFlavors} opções
            </p>
          </div>
          <p className="text-xs font-semibold tracking-wide text-sky-700">
            {flavorIds.length} / {PIZZA_MIN_FLAVORS}
            {flavorMet ? "" : " OBRIGATÓRIO"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">O valor final será baseado na opção de maior valor</p>
        <ul className="grid gap-1">
          {flavors.map((flavor) => {
            const extra = extraByFlavor(flavor);
            const checked = flavorIds.includes(flavor.id);
            const disabled = !flavor.active || (!checked && flavorIds.length >= size.maxFlavors);
            return (
              <li key={flavor.id}>
                <label
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60 ${
                    !flavor.active ? "cursor-not-allowed opacity-55" : ""
                  }`}
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      name="flavorId"
                      value={flavor.id}
                      checked={checked}
                      disabled={disabled}
                      onChange={() =>
                        flavor.active && setFlavorIds((current) => toggle(current, flavor.id, size.maxFlavors))
                      }
                      className="mt-1 size-4"
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{flavor.name}</span>
                        {!flavor.active ? (
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600">
                            EM FALTA
                          </span>
                        ) : null}
                      </span>
                      {flavor.description ? (
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                          {flavor.description}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {extra > 0 ? (
                    <span className="shrink-0 text-sm font-medium text-zinc-700">+ {formatBRL(extra)}</span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {addonGroups.map((group) => (
        <section key={group.id} className="grid gap-3 border-t px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-medium">{group.name}</h3>
              <p className="text-xs text-muted-foreground">Escolha até {group.maxSelect} opções</p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {addonIds.length} / {group.maxSelect}
            </p>
          </div>
          <ul className="grid gap-1">
            {group.addons.map((addon) => {
              const checked = addonIds.includes(addon.id);
              const disabled = !addon.active || (!checked && addonIds.length >= maxAddons);
              return (
                <li key={addon.id}>
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-muted/60 ${
                      !addon.active ? "cursor-not-allowed opacity-55" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="addonId"
                        value={addon.id}
                        checked={checked}
                        disabled={disabled}
                        onChange={() =>
                          addon.active && setAddonIds((current) => toggle(current, addon.id, maxAddons))
                        }
                        className="size-4"
                      />
                      <span className="font-medium">{addon.name}</span>
                      {!addon.active ? (
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600">
                          EM FALTA
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-zinc-700">+ {formatBRL(addon.priceCents)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="grid gap-2 border-t px-5 py-4">
        <div className="flex items-center justify-between">
          <label htmlFor="notes" className="font-medium">
            Alguma observação?
          </label>
          <span className="text-xs text-muted-foreground">
            {notes.length} / {PIZZA_NOTES_MAX}
          </span>
        </div>
        <Textarea
          id="notes"
          name="notes"
          maxLength={PIZZA_NOTES_MAX}
          value={notes}
          onChange={(event) => setNotes(event.target.value.slice(0, PIZZA_NOTES_MAX))}
          rows={3}
        />
        {lowStock ? <p className="text-sm font-medium text-amber-700">Últimas {lowStock} unidades</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>

      <div className="sticky bottom-0 border-t bg-background px-5 py-4">
        <Button type="submit" className="h-11 w-full text-base" disabled={pending || !flavorMet}>
          {pending ? "Adicionando..." : `Adicionar · ${formatBRL(preview.totalCents)}`}
        </Button>
      </div>
    </form>
  );
}
