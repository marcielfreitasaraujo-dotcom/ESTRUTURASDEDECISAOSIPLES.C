import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStoreGuest } from "@/server/store-guest";
import { listCustomerOrders } from "@/server/services/tracking";
import { customerStatusLabel } from "@/domain/ordering/tracking";
import { formatBRL } from "@/lib/money";
import { StoreGuestBar } from "@/components/storefront/store-guest";

export const metadata: Metadata = {
  title: "Meus pedidos",
  robots: { index: false, follow: false },
};

export default async function MyOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();
  const guest = await getStoreGuest();
  const orders = guest ? await listCustomerOrders(tenant.id, guest.phone) : [];

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-start gap-4 bg-[#eef1f4] px-4 py-8 text-zinc-900">
      <header className="flex items-center justify-between">
        <Link href={`/loja/${slug}`} className="text-sm font-medium text-zinc-600">
          ← Cardápio
        </Link>
        <StoreGuestBar slug={slug} guest={guest} />
      </header>
      <h1 className="font-heading text-2xl">Meus pedidos</h1>
      {!guest ? (
        <p className="rounded-3xl bg-white p-5 text-sm text-zinc-600 shadow-sm">
          Entre com nome e telefone para ver os pedidos deste número.
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-sm text-zinc-600 shadow-sm">Nenhum pedido neste telefone ainda.</p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.trackingToken} className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="font-semibold">Pedido #{order.publicCode}</p>
              <p className="text-sm text-zinc-500">
                {order.createdAt.toLocaleDateString("pt-BR")} · {formatBRL(order.totalCents)}
              </p>
              <p className="text-sm">{customerStatusLabel(order.status, order.fulfillment, order.rejected)}</p>
              <Link
                href={`/loja/${slug}/acompanhar/${order.trackingToken}`}
                className="mt-3 inline-flex h-10 items-center rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white"
              >
                Ver pedido
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
