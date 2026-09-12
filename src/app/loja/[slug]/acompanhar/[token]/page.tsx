import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByTrackingToken, toPublicTracking } from "@/server/services/tracking";
import { OrderTrackingView, TrackingSkeleton } from "@/components/storefront/order-tracking";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Acompanhamento do pedido",
    robots: { index: false, follow: false },
  };
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  let payload;
  try {
    const { order, tenant } = await getOrderByTrackingToken(token, slug);
    payload = toPublicTracking({ order, tenant });
  } catch {
    notFound();
  }

  if (payload.expired) {
    return (
      <div className="min-h-screen bg-[#eef1f4] px-4 py-10 text-zinc-900">
      <div className="mx-auto grid max-w-lg content-start gap-4">
        <h1 className="font-heading text-2xl">Pedido #{payload.publicCode}</h1>
        <p>Este acompanhamento não está mais disponível.</p>
        <Link href={`/loja/${slug}`} className="font-medium underline">
          Voltar ao cardápio
        </Link>
      </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<TrackingSkeleton />}>
      <OrderTrackingView initial={payload} slug={slug} token={token} />
    </Suspense>
  );
}
