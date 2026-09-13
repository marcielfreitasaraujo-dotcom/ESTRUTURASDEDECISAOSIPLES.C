import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookupOrderByCode, toPublicTracking } from "@/server/services/tracking";
import { publicErrorMessage } from "@/lib/errors";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const phone = url.searchParams.get("phone") || "";
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        whatsapp: true,
        timezone: true,
        trackingEnabled: true,
        trackingHistoryDays: true,
        trackingNotifyEnabled: true,
        status: true,
      },
    });
    if (!tenant || tenant.status === "SUSPENDED") {
      return NextResponse.json({ error: "Não encontramos esse pedido." }, { status: 404 });
    }
    const order = await lookupOrderByCode({ tenantId: tenant.id, publicCode: code, phone });
    return NextResponse.json(toPublicTracking({ order, tenant }), {
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (error) {
    const parsed = publicErrorMessage(error);
    return NextResponse.json({ error: parsed.message }, { status: parsed.status ?? 404 });
  }
}
