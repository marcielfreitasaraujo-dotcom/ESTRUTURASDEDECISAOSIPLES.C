import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    n: "01",
    title: "Primeiro contato",
    text: "Você entra em contato pelo WhatsApp.",
  },
  {
    n: "02",
    title: "Análise inicial",
    text: "Entendemos sua situação e suas necessidades.",
  },
  {
    n: "03",
    title: "Orientação jurídica",
    text: "Você recebe uma explicação clara sobre os possíveis caminhos.",
  },
  {
    n: "04",
    title: "Estratégia",
    text: "Caso seja necessário, definimos a estratégia adequada para sua situação.",
  },
  {
    n: "05",
    title: "Acompanhamento",
    text: "O escritório acompanha o caso com responsabilidade e transparência.",
  },
];

export function Process() {
  return (
    <section id="como-funciona" className="bg-ivory px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            eyebrow="Atendimento"
            title="Como funciona o atendimento?"
            subtitle="Um processo simples, transparente e pensado para que você saiba o que esperar em cada etapa."
          />
        </Reveal>

        <ol className="timeline mt-16 grid gap-10 lg:grid-cols-5">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 60}>
              <li className="relative pl-10 lg:pl-0 lg:pt-10">
                <span className="absolute top-1 left-0 flex h-6 w-6 items-center justify-center rounded-full border border-gold bg-ivory text-[0.65rem] font-semibold text-navy lg:top-0 lg:left-1/2 lg:-translate-x-1/2">
                  {step.n}
                </span>
                <h3 className="font-serif text-2xl lg:mt-6 lg:text-center">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted lg:text-center">
                  {step.text}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
