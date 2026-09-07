import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { WhatsAppButton } from "@/components/ui/ButtonLink";
import { PageHero } from "@/components/ui/PageHero";
import { articles, getArticle } from "@/lib/articles";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/conteudos/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.dateIso,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <>
      <PageHero eyebrow={article.category} title={article.title} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-muted">
          <time dateTime={article.dateIso}>{article.date}</time>
        </p>
        <div className="relative mt-6 aspect-[16/9] overflow-hidden">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
        <div className="mt-8 space-y-4 leading-relaxed text-muted">
          {article.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-10">
          <WhatsAppButton>Quero orientação sobre este tema</WhatsAppButton>
        </div>
      </article>
    </>
  );
}
