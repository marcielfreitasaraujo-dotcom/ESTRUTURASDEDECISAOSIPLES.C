import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { listCatalog } from "@/server/services/catalog";
import { getCart } from "@/server/services/cart";
import { getStoreStatus } from "@/domain/hours/store-status";
import { formatBRL } from "@/lib/money";
import { addProductToCartAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { PizzaBuilder } from "@/components/pizza-builder";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ mesa?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { title: "Loja não encontrada" };
  return {
    title: tenant.name,
    description: `Peça online na ${tenant.name}. Cardápio digital, pizza montada e retirada ou entrega.`,
    openGraph: { title: tenant.name, description: `Cardápio digital da ${tenant.name}` },
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { mesa } = await searchParams;
  const tableNumber = mesa?.trim() || "";
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { hours: true },
  });
  if (!tenant || tenant.status === "SUSPENDED" || tenant.deletedAt) notFound();

  const [catalog, cart] = await Promise.all([listCatalog(tenant.id), getCart(tenant.id)]);
  const status = getStoreStatus(tenant.hours, new Date(), tenant.timezone);
  const simpleProducts = catalog.products.filter((product) => product.kind !== "PIZZA" && product.active);

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.01_70)]">
      <header className="border-b bg-[color:var(--primary)] text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-8">
          <div>
            <p className="text-sm opacity-80">{status.label}</p>
            <h1 className="font-heading text-4xl">{tenant.name}</h1>
            <p className="mt-2 text-sm opacity-90">
              {tableNumber
                ? `Pedido da mesa ${tableNumber}`
                : `${tenant.estimatedMinutes} min · pedido mínimo ${formatBRL(tenant.minimumOrderCents)}`}
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href={`/loja/${slug}/carrinho${tableNumber ? `?mesa=${encodeURIComponent(tableNumber)}` : ""}`}>
              Pedido ({cart?.items.length ?? 0})
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8">
        <PizzaBuilder
          slug={slug}
          sizes={catalog.sizes}
          flavors={catalog.flavors}
          crusts={catalog.crusts}
          addons={catalog.addonGroups.flatMap((group) => group.addons)}
        />
        <section>
          <h2 className="font-heading text-2xl">Cardápio</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {simpleProducts.map((product) => (
              <article key={product.id} className="rounded-2xl border bg-card p-4">
                <h3 className="font-medium">{product.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span>{formatBRL(product.promotionalPriceCents ?? product.priceCents)}</span>
                  <form action={addProductToCartAction.bind(null, slug, product.id, 1)}>
                    <Button type="submit" size="sm">
                      Adicionar
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
