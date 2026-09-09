import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCart } from "@/server/services/cart";
import { CheckoutForm } from "@/components/checkout-form";
import { formatBRL } from "@/lib/money";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; mesa?: string }>;
}) {
  const { slug } = await params;
  const { error, mesa } = await searchParams;
  const tableNumber = mesa?.trim() || "";
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();
  const cart = await getCart(tenant.id);
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const errorMessage =
    error === "invalid"
      ? "Confira os dados do pedido."
      : error === "empty"
        ? "O carrinho está vazio."
        : error === "delivery"
          ? "Informe o bairro para entrega."
          : error === "failed"
            ? "Não foi possível concluir o pedido. Tente novamente."
            : undefined;

  return (
    <div className="mx-auto grid min-h-screen max-w-3xl gap-8 bg-[oklch(0.985_0.01_70)] px-4 py-8">
      <div>
        <h1 className="font-heading text-3xl">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          {tableNumber
            ? `Pedido da mesa ${tableNumber}. A cozinha recebe na hora.`
            : "Retirada, entrega em casa ou mesa. O servidor recalcula o preço."}
        </p>
      </div>
      <p>
        Itens: {items.length} · subtotal {formatBRL(subtotal)}
      </p>
      <CheckoutForm
        slug={slug}
        error={errorMessage}
        idempotencyKey={crypto.randomUUID()}
        tableNumber={tableNumber || undefined}
      />
    </div>
  );
}
