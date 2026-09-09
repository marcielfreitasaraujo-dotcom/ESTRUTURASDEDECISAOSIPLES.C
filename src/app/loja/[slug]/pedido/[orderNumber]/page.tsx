import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrderForTenant } from "@/server/services/orders";
import { formatBRL } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderNumber: string }>;
}) {
  const { slug, orderNumber } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();
  const order = await getOrderForTenant(tenant.id, orderNumber).catch(() => null);
  if (!order) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <p className="text-sm text-muted-foreground">{tenant.name}</p>
      <h1 className="font-heading text-4xl">Pedido #{order.publicCode}</h1>
      <div className="mt-4">
        <StatusBadge status={order.status} />
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity}× {item.name} — {formatBRL(item.totalCents)}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-lg">Total {formatBRL(order.totalCents)}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pagamento: {order.paymentMethod}. Acompanhe o status com a pizzaria.
      </p>
    </div>
  );
}
