import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { articles } from "@/lib/articles";
import { withBase } from "@/lib/paths";

export function Articles() {
  const [featured, ...rest] = articles;

  return (
    <section id="conteudos" className="bg-ivory px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow="Conteúdos"
              title="Informação para proteger seus direitos"
              subtitle="Artigos objetivos sobre benefícios previdenciários, preparados para ajudar você a entender o caminho com mais clareza."
            />
            <Link
              href="/conteudos"
              className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-navy hover:text-gold"
            >
              Ver todos os conteúdos
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <ArticleCard article={featured} featured />
          </Reveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {rest.slice(0, 3).map((article, index) => (
              <Reveal key={article.slug} delay={index * 60}>
                <ArticleCard article={article} compact />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArticleCard({
  article,
  featured = false,
  compact = false,
}: {
  article: (typeof articles)[number];
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <article className="group h-full bg-paper">
      <Link href={`/conteudos/${article.slug}`} className="block h-full">
        <div
          className={`relative overflow-hidden ${
            compact ? "aspect-[16/8]" : featured ? "aspect-[16/9]" : "aspect-[16/10]"
          }`}
        >
          <Image
            src={withBase(article.image)}
            alt={article.imageAlt}
            fill
            sizes={featured ? "(min-width:1024px) 58vw, 100vw" : "50vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="p-6">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">
            {article.category}
          </p>
          <h3
            className={`mt-2 ${featured ? "text-3xl" : "text-xl"} text-navy`}
          >
            {article.title}
          </h3>
          {!compact ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {article.excerpt}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-muted">
            <time dateTime={article.dateIso}>{article.date}</time>
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-navy">
            Leia mais
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}
