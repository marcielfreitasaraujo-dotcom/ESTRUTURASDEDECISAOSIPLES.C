import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaIcon } from "@/components/icons/AreaIcon";
import { WhatsAppButton } from "@/components/ui/ButtonLink";
import { PageHero } from "@/components/ui/PageHero";
import { areas, getArea } from "@/lib/areas";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) return {};
  return {
    title: area.title,
    description: area.short,
    alternates: { canonical: `/areas-de-atuacao/${area.slug}` },
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) notFound();

  return (
    <>
      <PageHero eyebrow="Áreas de atuação" title={area.title} subtitle={area.short} />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 inline-flex h-12 w-12 items-center justify-center border border-gold/40 text-gold">
          <AreaIcon name={area.icon} className="h-6 w-6" />
        </div>
        <p className="text-lg leading-relaxed text-ink">{area.intro}</p>
        <div className="mt-6 space-y-4 text-muted leading-relaxed">
          {area.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <h2 className="mt-12 text-2xl">Pontos de atenção neste tema</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
          {area.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">
          Este conteúdo é informativo e não substitui análise jurídica do caso
          concreto.
        </p>
        <div className="mt-8">
          <WhatsAppButton message={area.whatsappMessage}>
            Falar sobre este assunto
          </WhatsAppButton>
        </div>
      </section>
    </>
  );
}
