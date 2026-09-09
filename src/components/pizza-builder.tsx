"use client";

import { useMemo, useState } from "react";
import { addPizzaToCartAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/lib/money";
import { quotePizza } from "@/domain/catalog/pizza-pricing";

type Size = { id: string; name: string; maxFlavors: number; basePriceCents: number; pricingMode: "HIGHEST_FLAVOR" | "AVERAGE_FLAVOR" | "SUM_FLAVORS" };
type Flavor = { id: string; name: string; prices: { sizeId: string; priceCents: number }[] };
type Crust = { id: string; name: string; priceCents: number };
type Addon = { id: string; name: string; priceCents: number };

export function PizzaBuilder({
  slug,
  sizes,
  flavors,
  crusts,
  addons,
}: {
  slug: string;
  sizes: Size[];
  flavors: Flavor[];
  crusts: Crust[];
  addons: Addon[];
}) {
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [flavorIds, setFlavorIds] = useState<string[]>([]);
  const [crustId, setCrustId] = useState(crusts[0]?.id ?? "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const size = sizes.find((item) => item.id === sizeId) ?? sizes[0];
  const selectedFlavors = flavors.filter((flavor) => flavorIds.includes(flavor.id));
  const crust = crusts.find((item) => item.id === crustId);
  const selectedAddons = addons.filter((addon) => addonIds.includes(addon.id));

  const preview = useMemo(() => {
    if (!size || selectedFlavors.length === 0) return null;
    try {
      return quotePizza({
        sizeName: size.name,
        maxFlavors: size.maxFlavors,
        basePriceCents: size.basePriceCents,
        pricingMode: size.pricingMode,
        flavors: selectedFlavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          priceCents: flavor.prices.find((price) => price.sizeId === size.id)?.priceCents ?? 0,
        })),
        crustPriceCents: crust?.priceCents ?? 0,
        addons: selectedAddons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          priceCents: addon.priceCents,
          quantity: 1,
        })),
      });
    } catch {
      return null;
    }
  }, [size, selectedFlavors, crust, selectedAddons]);

  function toggle(list: string[], id: string, max: number) {
    if (list.includes(id)) return list.filter((item) => item !== id);
    if (list.length >= max) return list;
    return [...list, id];
  }

  return (
    <form
      className="grid gap-5 rounded-2xl border bg-card p-5"
      action={async (formData) => {
        const result = await addPizzaToCartAction(formData);
        setMessage(result.error ?? "Pizza adicionada ao pedido.");
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="quantity" value="1" />
      <h2 className="font-heading text-2xl">Monte sua pizza</h2>
      <div className="grid gap-2">
        <Label htmlFor="sizeId">Tamanho</Label>
        <select
          id="sizeId"
          name="sizeId"
          className="h-10 rounded-lg border bg-background px-3"
          value={sizeId}
          onChange={(event) => {
            setSizeId(event.target.value);
            setFlavorIds([]);
          }}
        >
          {sizes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · até {item.maxFlavors} sabor(es)
            </option>
          ))}
        </select>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Sabores</legend>
        {flavors.map((flavor) => (
          <label key={flavor.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="flavorId"
              value={flavor.id}
              checked={flavorIds.includes(flavor.id)}
              onChange={() => setFlavorIds((current) => toggle(current, flavor.id, size?.maxFlavors ?? 1))}
            />
            {flavor.name}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-2">
        <Label htmlFor="crustId">Borda</Label>
        <select
          id="crustId"
          name="crustId"
          className="h-10 rounded-lg border bg-background px-3"
          value={crustId}
          onChange={(event) => setCrustId(event.target.value)}
        >
          {crusts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.priceCents ? `+ ${formatBRL(item.priceCents)}` : ""}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Extras</legend>
        {addons.map((addon) => (
          <label key={addon.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="addonId"
              value={addon.id}
              checked={addonIds.includes(addon.id)}
              onChange={() => setAddonIds((current) => toggle(current, addon.id, 4))}
            />
            {addon.name} · {formatBRL(addon.priceCents)}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-2">
        <Label htmlFor="notes">Observação</Label>
        <Textarea id="notes" name="notes" placeholder="Pouco queijo, sem cebola..." />
      </div>
      <p className="text-lg font-medium">{preview ? formatBRL(preview.totalCents) : "Escolha os sabores"}</p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={!preview}>
        Adicionar ao pedido
      </Button>
    </form>
  );
}
