import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrderForTenant } from "@/server/services/orders";
import { formatBRL } from "@/lib/money";
import { FULFILLMENT_LABELS, PAYMENT_METHOD_LABELS } from "@/domain/ordering/status";
import { computeEta, formatClockInZone, formatDeliveryAddress, whatsAppMeUrl } from "@/domain/ordering/tracking";
import { storeNewOrderWhatsAppText, storeWhatsAppNumber } from "@/server/services/whatsapp";
import { WhatsAppOrderSend } from "@/components/storefront/whatsapp-order-send";

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
  const eta = computeEta(order.createdAt, order.estimatedMinutes);
  const address = formatDeliveryAddress({
    street: order.street,
    number: order.addressNumber,
    complement: order.complement,
    neighborhood: order.neighborhood,
    city: order.city,
    state: order.state,
    reference: order.reference,
  });
  const storePhone = storeWhatsAppNumber(tenant);
  const waHref = storePhone
    ? whatsAppMeUrl(
        storePhone,
        storeNewOrderWhatsAppText({
          ...order,
          tenant: { name: tenant.name, slug: tenant.slug },
        }),
      )
    : null;

  return (
    <div className="min-h-screen bg-[#eef1f4] px-4 py-10 text-zinc-900">
      <div className="mx-auto grid max-w-lg content-start gap-5">
        <p className="text-sm text-zinc-500">{tenant.name}</p>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Pedido realizado com sucesso!</p>
          <h1 className="mt-2 font-heading text-3xl">Pedido #{order.publicCode}</h1>
          <p className="mt-3 text-sm text-zinc-600">
            Recebemos seu pedido. Toque em enviar no WhatsApp para a pizzaria receber o endereço agora.
          </p>
          <dl className="mt-5 grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt>Total</dt>
              <dd className="font-semibold">{formatBRL(order.totalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pagamento</dt>
              <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tipo</dt>
              <dd>{FULFILLMENT_LABELS[order.fulfillment] ?? order.fulfillment}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tempo estimado</dt>
              <dd>{order.estimatedMinutes} min · {formatClockInZone(eta)}</dd>
            </div>
            {address ? (
              <div className="grid gap-1 border-t pt-2">
                <dt className="text-zinc-500">Endereço</dt>
                <dd>{address}</dd>
              </div>
            ) : null}
          </dl>
        </section>
        {waHref ? <WhatsAppOrderSend href={waHref} /> : null}
        <Link
          href={`/loja/${slug}/acompanhar/${order.trackingToken}`}
          className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white"
        >
          Acompanhar meu pedido
        </Link>
        <Link
          href={`/loja/${slug}`}
          className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-semibold"
        >
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
