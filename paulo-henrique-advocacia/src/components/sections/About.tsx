import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollWords } from "@/components/ui/ScrollWords";
import { withBase } from "@/lib/paths";

export function About() {
  return (
    <section id="escritorio" className="bg-ivory px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="gold-frame">
            <Image
              src={withBase("/images/paulo-henrique.webp")}
              alt="Paulo Henrique, advogado do escritório Paulo Henrique Advocacia Previdenciária"
              width={629}
              height={627}
              quality={90}
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="relative z-10 block h-auto w-full object-cover object-[center_18%]"
            />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <p className="eyebrow">O escritório</p>
          <h2 className="mt-4 text-3xl text-navy sm:text-4xl lg:text-[2.6rem]">
            <ScrollWords text="Advocacia feita com estratégia, responsabilidade e humanidade." />
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
