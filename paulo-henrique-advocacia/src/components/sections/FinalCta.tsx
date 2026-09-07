import { WhatsAppButton } from "@/components/ui/ButtonLink";

export function FinalCta() {
  return (
    <section className="bg-navy px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mx-auto justify-center">Atendimento</p>
        <h2 className="mt-5 text-3xl text-ivory sm:text-5xl">
          Precisa de orientação sobre seu benefício previdenciário?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ivory/78">
          Fale com nossa equipe e explique sua situação. Vamos orientar você
          sobre os próximos passos.
        </p>
        <div className="mt-10">
          <WhatsAppButton className="min-h-14 px-8 text-[0.82rem]">
            Falar com o escritório pelo WhatsApp
          </WhatsAppButton>
        </div>
        <p className="mt-5 text-sm text-ivory/55">
          Atendimento personalizado e seguro.
        </p>
      </div>
    </section>
  );
}
