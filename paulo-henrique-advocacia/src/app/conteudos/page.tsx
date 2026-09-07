import type { Metadata } from "next";
import { ArticleCard } from "@/components/sections/Articles";
import { PageHero } from "@/components/ui/PageHero";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Conteúdos",
  description:
    "Artigos sobre aposentadoria rural, BPC/LOAS, auxílio-doença, salário-maternidade, pensão por morte e revisão de benefícios do INSS.",
  alternates: { canonical: "/conteudos" },
};

export default function ConteudosPage() {
  return (
    <>
      <PageHero
        eyebrow="Conteúdos"
        title="Informação para proteger seus direitos"
        subtitle="Estrutura preparada para um blog jurídico. Os textos abaixo são informativos e não substituem orientação individualizada."
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </section>
    </>
  );
}
