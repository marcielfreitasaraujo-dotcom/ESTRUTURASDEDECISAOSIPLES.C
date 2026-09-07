import {
  HeartHandshake,
  Laptop,
  Scale,
  Search,
  UserRound,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const items = [
  {
    icon: HeartHandshake,
    title: "Atendimento Humanizado",
    text: "Você será atendido com atenção, respeito e clareza.",
  },
  {
    icon: Search,
    title: "Análise Individualizada",
    text: "Cada caso é estudado considerando suas particularidades.",
  },
  {
    icon: Scale,
    title: "Especialização Previdenciária",
    text: "Atuação direcionada às demandas envolvendo benefícios previdenciários e INSS.",
  },
  {
    icon: UserRound,
    title: "Estratégia Jurídica",
    text: "Cada situação é analisada para identificar os caminhos jurídicos mais adequados.",
  },
  {
    icon: Laptop,
    title: "Atendimento Online",
    text: "Possibilidade de atendimento remoto para clientes de diferentes regiões do Brasil.",
  },
];

export function Differentials() {
  return (
    <section
      id="diferenciais"
      className="bg-paper px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            eyebrow="Por que o escritório"
            title="Por que escolher o Paulo Henrique Advocacia?"
          />
        </Reveal>

        <ol className="mt-14 grid gap-8 lg:grid-cols-5">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 50}>
              <li className="diff-item h-full border-t border-gold/50 pt-6">
                <span className="icon-float inline-flex text-gold">
                  <item.icon className="h-6 w-6" strokeWidth={1.4} aria-hidden />
                </span>
                <p className="mt-4 font-serif text-xl text-navy">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
