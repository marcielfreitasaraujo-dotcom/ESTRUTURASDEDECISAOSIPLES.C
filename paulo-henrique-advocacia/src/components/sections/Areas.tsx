import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AreaIcon } from "@/components/icons/AreaIcon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { areas } from "@/lib/areas";

export function Areas() {
  return (
    <section id="atuacao" className="bg-ivory px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            eyebrow="Áreas de atuação"
            title="Como podemos ajudar você"
            subtitle="Cada situação previdenciária possui suas particularidades. Nossa atuação é direcionada para entender o seu caso e buscar a melhor estratégia jurídica."
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {areas.map((area, index) => (
            <Reveal key={area.slug} delay={index * 40}>
              <article className="area-card flex h-full flex-col border border-line bg-paper p-6">
                <span className="icon-float inline-flex h-11 w-11 items-center justify-center border border-gold/40 text-gold">
                  <AreaIcon name={area.icon} />
                </span>
                <h3 className="mt-5 text-2xl">{area.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {area.short}
                </p>
                <Link
                  href={`/areas-de-atuacao/${area.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-navy transition-colors duration-300 hover:text-gold"
                >
                  Saiba mais
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
