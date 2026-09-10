import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCart } from "@/server/services/cart";
import { getStoreStatus } from "@/domain/hours/store-status";
import { formatBRL } from "@/lib/money";
import { updateCartItemAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default async function CartPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mesa?: string }>;
}) {
  const { slug } = await params;
  const { mesa } = await searchParams;
  const tableNumber = mesa?.trim() || "";
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { hours: true },
  });
  if (!tenant) notFound();
  const cart = await getCart(tenant.id);
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const query = tableNumber ? `?mesa=${encodeURIComponent(tableNumber)}` : "";
  const status = getStoreStatus(tenant.hours, new Date(), tenant.timezone);

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-zinc-500">Carrinho</p>
            <h1 className="font-heading text-lg">{tenant.name}</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/loja/${slug}${query}`}>Continuar escolhendo</Link>
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {tableNumber ? <p className="mb-4 text-sm text-muted-foreground">Mesa {tableNumber}</p> : null}
        {items.length === 0 ? (
          <EmptyState title="Carrinho vazio" description="Volte ao cardápio e adicione uma pizza ou uma bebida." />
        ) : (
          <ul className="grid gap-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatBRL(item.unitPriceCents)}
                  </p>
                </div>
                <form action={updateCartItemAction.bind(null, slug, item.id, 0)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Remover
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-lg">Subtotal {formatBRL(subtotal)}</p>
        <div className="mt-6 flex gap-3">
          {status.open && items.length > 0 ? (
            <Button asChild>
              <Link href={`/loja/${slug}/checkout${query}`}>Finalizar pedido</Link>
            </Button>
          ) : (
            <Button type="button" disabled>
              {status.open ? "Finalizar pedido" : "Estabelecimento fechado"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
