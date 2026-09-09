import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCart } from "@/server/services/cart";
import { formatBRL } from "@/lib/money";
import { updateCartItemAction } from "@/app/actions/storefront";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();
  const cart = await getCart(tenant.id);
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl">Seu pedido</h1>
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Carrinho vazio" description="Volte ao cardápio e adicione uma pizza ou uma bebida." />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-4">
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
        <Button variant="outline" asChild>
          <Link href={`/loja/${slug}`}>Continuar comprando</Link>
        </Button>
        <Button asChild disabled={items.length === 0}>
          <Link href={`/loja/${slug}/checkout`}>Finalizar</Link>
        </Button>
      </div>
    </div>
  );
}
