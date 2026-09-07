import { WhatsAppButton } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";

export function HighlightCta() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow mx-auto justify-center">Análise do caso</p>
          <h2 className="mt-5 text-4xl sm:text-5xl">
            Não sabe se você tem direito?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Antes de tomar qualquer decisão, converse com um profissional. Uma
            análise adequada pode ajudar você a compreender melhor sua situação
            previdenciária e os caminhos disponíveis.
          </p>
          <div className="mt-10">
            <WhatsAppButton message="Olá, gostaria de analisar meu caso previdenciário.">
              Quero analisar meu caso
            </WhatsAppButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
