import type { Metadata } from "next";
import Image from "next/image";
import { WhatsAppButton } from "@/components/ui/ButtonLink";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "O Escritório",
  description:
    "Conheça o escritório Paulo Henrique Advocacia Previdenciária, em Estreito - MA: atendimento humanizado, ética e estratégia em Direito Previdenciário.",
  alternates: { canonical: "/escritorio" },
};

export default function EscritorioPage() {
  return (
    <>
      <PageHero
        eyebrow="O escritório"
        title="Advocacia feita com estratégia, responsabilidade e humanidade."
        subtitle="Atendimento previdenciário em Estreito - MA, com possibilidade de orientação online para clientes em todo o Brasil."
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Image
            src="/images/about-office.webp"
            alt="Sala de atendimento ilustrativa — substituir pela fotografia oficial do escritório"
            width={1200}
            height={900}
            className="w-full"
          />
          <p className="mt-3 text-xs text-muted">
            Imagem institucional ilustrativa — substituir pela fotografia
            oficial.
          </p>
        </div>
        <div className="space-y-5 text-muted leading-relaxed">
          <p>
            O escritório Paulo Henrique Advocacia nasceu com o propósito de
            oferecer serviços jurídicos de excelência, unindo conhecimento
            técnico, responsabilidade, transparência e atendimento humanizado.
          </p>
          <p>
            Cada cliente possui uma história diferente. Por isso, cada caso é
            analisado de maneira individual, buscando compreender as
            necessidades e apresentar uma estratégia adequada.
          </p>
          <p>
            Nossa atuação é pautada pela ética, clareza na comunicação,
            compromisso com prazos e respeito às pessoas que confiam em nosso
            trabalho.
          </p>
          <p>
            A especialidade principal é o Direito Previdenciário: aposentadorias,
            BPC/LOAS, benefícios por incapacidade, salário-maternidade, pensão
            por morte e revisões perante o INSS.
          </p>
          <p>
            {site.founder.name} atende em {site.address.display}, de segunda a
            sexta, das 08:00 às 18:00, e também de forma remota.
          </p>
          <WhatsAppButton>Solicitar atendimento</WhatsAppButton>
        </div>
      </section>
    </>
  );
}
