import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Termos de Uso do site ${site.shortName}.`,
  alternates: { canonical: "/termos" },
};

export default function TermosPage() {
  return (
    <>
      <PageHero eyebrow="Institucional" title="Termos de Uso" />
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-16 text-muted leading-relaxed sm:px-6 lg:px-8">
        <p>
          O conteúdo deste site tem caráter informativo e institucional. Não
          substitui consulta jurídica nem estabelece, por si só, relação de
          mandato ou contrato de honorários.
        </p>
        <h2 className="text-2xl text-navy">1. Natureza das informações</h2>
        <p>
          Artigos, respostas de FAQ e textos sobre benefícios previdenciários
          são gerais. Cada caso depende de fatos, documentos e regras
          aplicáveis. Nenhuma informação publicada neste site constitui
          promessa de resultado.
        </p>
        <h2 className="text-2xl text-navy">2. Contato e atendimento</h2>
        <p>
          O envio de mensagem pelo WhatsApp ou e-mail inicia um contato. A
          aceitação do caso, honorários e demais condições são definidos em
          conversa posterior, com as formalidades próprias da advocacia.
        </p>
        <h2 className="text-2xl text-navy">3. Propriedade intelectual</h2>
        <p>
          Textos, marca, layout e demais elementos do site pertencem ao{" "}
          {site.shortName}, salvo indicação em contrário. Imagens institucionais
          identificadas como ilustrativas podem ser substituídas por fotografias
          oficiais do escritório.
        </p>
        <h2 className="text-2xl text-navy">4. Foro</h2>
        <p>
          Questões relacionadas a estes termos serão interpretadas segundo a
          legislação brasileira, com foro preferencial na comarca de Estreito -
          MA, quando aplicável.
        </p>
      </section>
    </>
  );
}
