import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicTrackRedirect({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await prisma.order.findFirst({
    where: { trackingToken: token },
    select: { tenant: { select: { slug: true } } },
  });
  if (!order) notFound();
  redirect(`/loja/${order.tenant.slug}/acompanhar/${token}`);
}
