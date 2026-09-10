import { createWaiterOrderAction, createCashierOrderAction } from "@/app/actions/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/money";

type Product = { id: string; name: string; priceCents: number; promotionalPriceCents: number | null; kind: string; active?: boolean };
type Size = { id: string; name: string; maxFlavors: number };
type Flavor = { id: string; name: string; active?: boolean };
type Crust = { id: string; name: string; priceCents: number };

export function StaffOrderForm({
  mode,
  products,
  sizes,
  flavors,
  crusts,
  error,
  ok,
}: {
  mode: "waiter" | "cashier";
  products: Product[];
  sizes: Size[];
  flavors: Flavor[];
  crusts: Crust[];
  error?: string;
  ok?: string;
}) {
  const action = mode === "waiter" ? createWaiterOrderAction : createCashierOrderAction;
  const simple = products.filter((product) => product.kind !== "PIZZA" && product.active !== false);
  const availableFlavors = flavors.filter((flavor) => flavor.active !== false);

  return (
    <form action={action} method="post" className="grid gap-5">
      <input type="hidden" name="idempotencyKey" value={crypto.randomUUID()} />
      {error ? <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="rounded-lg bg-primary/15 px-3 py-2 text-sm">Comanda #{ok} enviada.</p> : null}

      {mode === "waiter" ? (
        <div className="grid gap-2">
          <Label htmlFor="tableNumber">Mesa</Label>
          <Input id="tableNumber" name="tableNumber" inputMode="numeric" placeholder="7" required className="h-12 text-lg" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="customerName">Cliente</Label>
            <Input id="customerName" name="customerName" placeholder="Balcão" className="h-12" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Pagamento</Label>
            <select id="paymentMethod" name="paymentMethod" className="h-12 rounded-lg border bg-background px-3">
              <option value="CASH">Dinheiro</option>
              <option value="PIX">PIX</option>
              <option value="CARD">Cartão</option>
            </select>
          </div>
        </div>
      )}

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Cardápio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {simple.map((product) => (
            <label key={product.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <span>
                <span className="block font-medium">{product.name}</span>
                <span className="text-sm text-muted-foreground">
                  {formatBRL(product.promotionalPriceCents ?? product.priceCents)}
                </span>
              </span>
              <Input
                name={`qty_${product.id}`}
                type="number"
                min={0}
                defaultValue={0}
                className="h-12 w-20 text-center text-lg"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border bg-card p-4">
        <h2 className="text-lg font-semibold">Pizza</h2>
        <select name="sizeId" className="h-12 rounded-lg border bg-background px-3" defaultValue={sizes[0]?.id}>
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name} · até {size.maxFlavors} sabor(es)
            </option>
          ))}
        </select>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Sabores</legend>
          {availableFlavors.map((flavor) => (
            <label key={flavor.id} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="flavorId" value={flavor.id} className="size-5" />
              {flavor.name}
            </label>
          ))}
        </fieldset>
        <select name="crustId" className="h-12 rounded-lg border bg-background px-3" defaultValue={crusts[0]?.id}>
          {crusts.map((crust) => (
            <option key={crust.id} value={crust.id}>
              {crust.name}
            </option>
          ))}
        </select>
        <Input name="pizzaNotes" placeholder="Pouco queijo, sem cebola..." className="h-12" />
      </section>

      <div className="grid gap-2">
        <Label htmlFor="notes">Observação da comanda</Label>
        <Input id="notes" name="notes" className="h-12" />
      </div>

      <Button type="submit" size="lg" className="h-14 text-base">
        {mode === "waiter" ? "Enviar para a cozinha" : "Lançar no caixa"}
      </Button>
    </form>
  );
}
