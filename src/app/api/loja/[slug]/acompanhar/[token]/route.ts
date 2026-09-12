import { NextResponse } from "next/server";
import { getOrderByTrackingToken, toPublicTracking } from "@/server/services/tracking";
import { publicErrorMessage } from "@/lib/errors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; token: string }> },
) {
  const { slug, token } = await context.params;
  try {
    const { order, tenant } = await getOrderByTrackingToken(token, slug);
    return NextResponse.json(toPublicTracking({ order, tenant }), {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    const parsed = publicErrorMessage(error);
    return NextResponse.json({ error: parsed.message, code: parsed.code }, { status: parsed.status ?? 404 });
  }
}
