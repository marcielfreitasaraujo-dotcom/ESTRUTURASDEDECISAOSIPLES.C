import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { areas } from "@/lib/areas";

export const metadata: Metadata = {
  title: "Áreas de Atuação",
  description:
    "Aposentadorias, BPC/LOAS, auxílio-doença, auxílio-acidente, salário-maternidade, pensão por morte e revisões contra o INSS.",
  alternates: { canonical: "/areas-de-atuacao" },
};

export default function AreasIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Áreas de atuação"
        title="Como podemos ajudar você"
        subtitle="Atuação previdenciária organizada por temas, para facilitar o entendimento da sua situação."
      />
      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-16 sm:px-6 lg:px-8">
        {areas.map((area) => (
          <Link
            key={area.slug}
            href={`/areas-de-atuacao/${area.slug}`}
            className="border border-line bg-paper p-6 transition-colors duration-300 hover:border-gold"
          >
            <h2 className="text-2xl">{area.title}</h2>
            <p className="mt-2 text-sm text-muted">{area.short}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
