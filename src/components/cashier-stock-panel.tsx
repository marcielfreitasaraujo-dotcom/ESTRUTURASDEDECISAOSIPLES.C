"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCashierProductStockAction } from "@/app/actions/pos";
import { isSoldOut } from "@/domain/catalog/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";

export type CashierStockProduct = {
  id: string;
  name: string;
  categoryName: string;
  priceCents: number;
  available: boolean;
  trackInventory: boolean;
  stockQuantity: number | null;
  imageUrl: string | null;
};

export function CashierStockPanel({ products }: { products: CashierStockProduct[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) || product.categoryName.toLowerCase().includes(term),
    );
  }, [products, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CashierStockProduct[]>();
    for (const product of filtered) {
      const list = map.get(product.categoryName) ?? [];
      list.push(product);
      map.set(product.categoryName, list);
    }
    return [...map.entries()];
  }, [filtered]);

  function save(productId: string, quantity: number) {
    setError(null);
    setPendingId(productId);
    startTransition(async () => {
      try {
        await setCashierProductStockAction(productId, quantity);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o estoque.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar item do cardápio"
        className="h-10 max-w-md"
        aria-label="Buscar item do cardápio"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
      ) : (
        groups.map(([category, items]) => (
          <section key={category} className="grid gap-2">
            <h2 className="text-lg font-semibold">{category}</h2>
            <ul className="grid gap-2">
              {items.map((product) => {
                const soldOut = isSoldOut(product);
                const busy = pending && pendingId === product.id;
                const defaultQty =
                  product.trackInventory || soldOut ? String(product.stockQuantity ?? 0) : "";
                return (
                  <li
                    key={`${product.id}-${product.stockQuantity}-${product.available}`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 rounded-md object-contain"
                      />
                    ) : (
                      <span className="size-12 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(product.priceCents)}
                        {soldOut ? " · esgotado na loja" : " · disponível na loja"}
                      </p>
                    </div>
                    <form
                      className="flex flex-wrap items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const quantity = Number(new FormData(event.currentTarget).get("quantity"));
                        save(product.id, Number.isFinite(quantity) ? quantity : 0);
                      }}
                    >
                      <label className="sr-only" htmlFor={`qty-${product.id}`}>
                        Quantidade de {product.name}
                      </label>
                      <Input
                        id={`qty-${product.id}`}
                        name="quantity"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={defaultQty}
                        placeholder="qtd"
                        className="h-9 w-20"
                      />
                      <Button type="submit" size="sm" variant="outline" disabled={busy}>
                        {busy ? "Salvando..." : "Salvar"}
                      </Button>
                      {soldOut ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={(event) => {
                            const form = event.currentTarget.form;
                            const quantity = form ? Number(new FormData(form).get("quantity")) : 1;
                            save(product.id, Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
                          }}
                        >
                          Reabastecer
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => save(product.id, 0)}
                        >
                          Esgotado
                        </Button>
                      )}
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
