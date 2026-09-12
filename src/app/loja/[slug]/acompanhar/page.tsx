import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStoreGuest } from "@/server/store-guest";
import { findActiveOrderForPhone, lookupOrderByCode } from "@/server/services/tracking";
import { StoreGuestBar } from "@/components/storefront/store-guest";

export const metadata: Metadata = {
  title: "Acompanhe seu pedido",
  robots: { index: false, follow: false },
};

export default async function TrackLookupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ erro?: string; code?: string }>;
}) {
  const { slug } = await params;
  const { erro, code } = await searchParams;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status === "SUSPENDED") notFound();
  const guest = await getStoreGuest();
  const active = guest ? await findActiveOrderForPhone(tenant.id, guest.phone) : null;
  if (active) redirect(`/loja/${slug}/acompanhar/${active.trackingToken}`);

  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-start gap-6 bg-[#eef1f4] px-4 py-8 text-zinc-900">
      <header className="flex items-center justify-between">
        <Link href={`/loja/${slug}`} className="text-sm font-medium text-zinc-600">
          ← Cardápio
        </Link>
        <StoreGuestBar slug={slug} guest={guest} />
      </header>
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl">Acompanhe seu pedido</h1>
        <p className="mt-2 text-sm text-zinc-600">Digite o número do pedido para acompanhar o andamento.</p>
        {erro ? <p className="mt-3 text-sm text-red-600">{erro}</p> : null}
        <form action={lookupOrderAction} className="mt-5 grid gap-3">
          <input type="hidden" name="slug" value={slug} />
          <label className="grid gap-1 text-sm">
            Número do pedido
            <input
              name="code"
              defaultValue={code}
              required
              placeholder="1025"
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Telefone do pedido
            <input
              name="phone"
              defaultValue={guest?.phone ?? ""}
              required
              placeholder="(91) 99151-5550"
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base"
            />
          </label>
          <button type="submit" className="h-12 rounded-full bg-zinc-950 text-sm font-semibold text-white">
            Acompanhar pedido
          </button>
        </form>
        {guest ? (
          <p className="mt-4 text-center text-sm">
            <Link href={`/loja/${slug}/pedidos`} className="font-medium underline">
              Ver meus pedidos
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}

async function lookupOrderAction(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "");
  const code = String(formData.get("code") || "");
  const phone = String(formData.get("phone") || "");
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) redirect(`/loja/${slug}/acompanhar?erro=${encodeURIComponent("Loja não encontrada.")}`);
  let token = "";
  try {
    const order = await lookupOrderByCode({ tenantId: tenant.id, publicCode: code, phone });
    token = order.trackingToken;
  } catch {
    redirect(
      `/loja/${slug}/acompanhar?code=${encodeURIComponent(code)}&erro=${encodeURIComponent("Não encontramos esse pedido.")}`,
    );
  }
  redirect(`/loja/${slug}/acompanhar/${token}`);
}
