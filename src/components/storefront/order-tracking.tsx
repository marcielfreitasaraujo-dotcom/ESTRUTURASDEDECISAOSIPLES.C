"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bike,
  Check,
  Circle,
  Clock3,
  HelpCircle,
  MapPin,
  Package,
  Phone,
  Store,
  Wallet,
} from "lucide-react";
import { formatClockInZone, type TimelineItem } from "@/domain/ordering/tracking";
import { formatBRL } from "@/lib/money";
import type { PublicTracking } from "@/server/services/tracking";

type Snapshot = Extract<PublicTracking, { expired: false }>;

export function OrderTrackingView({
  initial,
  slug,
  token,
}: {
  initial: Snapshot;
  slug: string;
  token: string;
}) {
  const [data, setData] = useState(initial);
  const [offline, setOffline] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/loja/${slug}/acompanhar/${token}`, { cache: "no-store" });
        if (!response.ok) throw new Error("fail");
        const next = (await response.json()) as PublicTracking;
        if (next.expired) return;
        setOffline(false);
        setData((current) => {
          if (current.status !== next.status) {
            setBanner(next.headline);
          } else if (current.estimatedMinutes !== next.estimatedMinutes) {
            setBanner("Devido ao volume de pedidos, sua previsão foi atualizada.");
          }
          return next;
        });
      } catch {
        setOffline(true);
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [slug, token]);

  const remaining = Math.max(0, data.remainingMinutes);
  const etaLabel = formatClockInZone(new Date(data.eta));
  const done = data.status === "DELIVERED";
  const failed = data.status === "CANCELLED" || data.rejected;

  return (
    <div className="min-h-screen bg-[#eef1f4] text-zinc-900">
    <div className="mx-auto grid max-w-lg gap-4 px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <Link href={`/loja/${slug}`} className="text-sm font-medium text-zinc-600">
          ← Voltar
        </Link>
        <p className="text-xs text-zinc-500">{data.storeName}</p>
      </header>

      {offline ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não conseguimos atualizar seu pedido. Tentaremos novamente automaticamente.
        </p>
      ) : null}
      {banner ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          {banner}
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Package className="size-4" /> Pedido #{data.publicCode}
        </p>
        <h1 className="mt-2 font-heading text-2xl leading-tight">{data.headline}</h1>
        {!failed && !done ? (
          <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              <Clock3 className="size-4" /> Previsão
            </p>
            <p className="mt-1 text-3xl font-semibold">{remaining} min</p>
            <p className="text-sm text-zinc-600">Seu pedido deve ficar pronto por volta de {etaLabel}.</p>
            {data.estimatedMinMinutes && data.estimatedMaxMinutes ? (
              <p className="text-xs text-zinc-500">
                Faixa: {data.estimatedMinMinutes}–{data.estimatedMaxMinutes} min
              </p>
            ) : null}
            {data.late ? <p className="mt-2 text-sm text-amber-700">{data.lateMessage}</p> : null}
            {data.etaUpdated ? (
              <p className="mt-1 text-sm text-zinc-600">A previsão foi atualizada pelo estabelecimento.</p>
            ) : null}
          </div>
        ) : null}
        {done ? (
          <p className="mt-3 text-lg">Obrigado por pedir com a gente!</p>
        ) : null}
        {failed && data.cancelReason ? <p className="mt-3 text-sm text-zinc-600">{data.cancelReason}</p> : null}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Status do pedido</h2>
        <ol className="mt-4 grid gap-3">
          {data.timeline.map((step) => (
            <TimelineRow key={step.key} step={step} />
          ))}
        </ol>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Seu pedido</h2>
        <ul className="mt-3 grid gap-3">
          {data.items.map((item) => (
            <li key={`${item.name}-${item.quantity}`} className="flex gap-3">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="size-14 rounded-xl object-cover" />
              ) : (
                <span className="grid size-14 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                  <Package className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {item.quantity}x {item.name}
                </p>
                <p className="text-sm text-zinc-500">{formatBRL(item.totalCents)}</p>
                {item.extras.length > 0 ? (
                  <p className="text-xs text-zinc-500">
                    {item.extras.map((extra) => extra.name).join(", ")}
                  </p>
                ) : null}
                {item.notes ? <p className="text-xs text-zinc-600">Obs.: {item.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Resumo</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{data.totals.subtotalLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa de entrega</dt>
            <dd>{data.totals.deliveryLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto{data.couponCode ? ` (${data.couponCode})` : ""}</dt>
            <dd>{data.totals.discountLabel}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{data.totals.totalLabel}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-center gap-2 text-sm">
          <Wallet className="size-4" /> {data.paymentLabel}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm">
          {data.fulfillment === "DELIVERY" ? <Bike className="size-4" /> : <Store className="size-4" />}
          {data.fulfillmentLabel}
        </p>
        {data.address ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-zinc-600">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>
              {[data.address.street, data.address.number].filter(Boolean).join(", ")}
              {data.address.neighborhood ? ` · ${data.address.neighborhood}` : ""}
              {data.address.city ? ` · ${data.address.city}/${data.address.state ?? ""}` : ""}
              {data.address.reference ? ` · ${data.address.reference}` : ""}
            </span>
          </p>
        ) : null}
      </section>

      <HelpCard phone={data.storePhone} whatsapp={data.storeWhatsapp} storeName={data.storeName} />

      <div className="grid gap-2 pb-8">
        {done || failed ? (
          <Link
            href={`/loja/${slug}`}
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white"
          >
            Fazer novo pedido
          </Link>
        ) : null}
        <Link
          href={`/loja/${slug}`}
          className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-semibold"
        >
          Voltar ao cardápio
        </Link>
      </div>
    </div>
    </div>
  );
}

function TimelineRow({ step }: { step: TimelineItem }) {
  const time = step.at ? formatClockInZone(new Date(step.at)) : step.state === "current" ? "Agora" : "";
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
          step.state === "done"
            ? "bg-emerald-600 text-white"
            : step.state === "current"
              ? "bg-zinc-950 text-white"
              : "border border-zinc-300 text-zinc-400"
        }`}
      >
        {step.state === "done" ? <Check className="size-3.5" /> : <Circle className="size-2.5 fill-current" />}
      </span>
      <div>
        <p className={`text-sm ${step.state === "upcoming" ? "text-zinc-400" : "font-medium"}`}>{step.label}</p>
        {time ? <p className="text-xs text-zinc-500">{time}</p> : null}
      </div>
    </li>
  );
}

function HelpCard({
  phone,
  whatsapp,
  storeName,
}: {
  phone: string | null;
  whatsapp: string | null;
  storeName: string;
}) {
  const digits = (whatsapp || phone || "").replace(/\D/g, "");
  const wa = digits ? `https://wa.me/55${digits.replace(/^55/, "")}` : null;
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <HelpCircle className="size-4" /> Precisa de ajuda?
      </h2>
      <p className="mt-1 text-sm text-zinc-600">Fale com {storeName} sobre este pedido.</p>
      <div className="mt-3 grid gap-2">
        {wa ? (
          <a
            href={wa}
            className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        ) : null}
        {phone ? (
          <a href={`tel:${phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border text-sm font-semibold">
            <Phone className="size-4" /> {phone}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function TrackingSkeleton() {
  return (
    <div className="min-h-screen bg-[#eef1f4] px-4 py-5">
      <div className="mx-auto grid max-w-lg gap-4">
      <p className="text-sm text-zinc-500">Pedido #----</p>
      <div className="h-36 animate-pulse rounded-3xl bg-white" />
      <div className="h-56 animate-pulse rounded-3xl bg-white" />
      <div className="h-40 animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}

