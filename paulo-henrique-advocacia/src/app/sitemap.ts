import type { MetadataRoute } from "next";
import { areas } from "@/lib/areas";
import { articles } from "@/lib/articles";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-09-07");
  const staticRoutes = [
    "",
    "/escritorio",
    "/areas-de-atuacao",
    "/conteudos",
    "/contato",
    "/faq",
    "/privacidade",
    "/termos",
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const areaRoutes = areas.map((area) => ({
    url: `${site.url}/areas-de-atuacao/${area.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const articleRoutes = articles.map((article) => ({
    url: `${site.url}/conteudos/${article.slug}`,
    lastModified: new Date(article.dateIso),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...areaRoutes, ...articleRoutes];
}
