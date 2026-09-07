import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";

export function About() {
  return (
    <section id="escritorio" className="bg-ivory px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="gold-frame">
            <Image
              src="/images/about-office.webp"
              alt="Sala de atendimento ilustrativa — substituir pela fotografia oficial do escritório"
              width={1200}
              height={900}
              className="relative z-10 h-auto w-full object-cover"
            />
          </div>
          <p className="mt-4 text-xs tracking-wide text-muted">
            Imagem institucional ilustrativa — substituir pela fotografia
            oficial do escritório.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <p className="eyebrow">O escritório</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.6rem]">
            Advocacia feita com estratégia, responsabilidade e humanidade.
          </h2>
          <div className="mt-6 space-y-4 text-[1.05rem] leading-relaxed text-muted">
            <p>
              O escritório Paulo Henrique Advocacia nasceu com o propósito de
              oferecer serviços jurídicos de excelência, unindo conhecimento
              técnico, responsabilidade, transparência e atendimento
              humanizado.
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
          </div>
          <div className="mt-8">
            <ButtonLink href="/escritorio" variant="outline-dark">
              Conheça nossa história
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
