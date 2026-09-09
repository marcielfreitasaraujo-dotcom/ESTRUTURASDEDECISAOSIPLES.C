import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: base, lastModified: new Date() },
    ...tenants.map((tenant) => ({
      url: `${base}/loja/${tenant.slug}`,
      lastModified: tenant.updatedAt,
    })),
  ];
}
