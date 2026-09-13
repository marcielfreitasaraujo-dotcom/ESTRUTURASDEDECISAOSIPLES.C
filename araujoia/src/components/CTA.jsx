import Reveal from "./Reveal";
import { links } from "../data/site";

export default function CTA() {
  return (
    <section id="contato" className="pad-x relative overflow-hidden py-28 md:py-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(61,190,180,0.16),transparent_50%)]" aria-hidden="true" />
      <Reveal>
        <h2 className="max-w-[12ch] font-display text-[clamp(2.4rem,7vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
          Tem uma ideia?
          <span className="mt-2 block text-accent">Vamos transformar em solução.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Conte para nós o que você precisa e vamos encontrar a melhor solução digital para o seu negócio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center rounded-[2px] bg-accent px-5 font-semibold text-bg shadow-glow transition hover:-translate-y-0.5 hover:bg-hover"
          >
            Falar com a AraújoIA →
          </a>
          <a
            href="#projetos"
            className="inline-flex min-h-12 items-center rounded-[2px] border border-white/15 px-5 font-semibold transition hover:border-accent hover:bg-accent/10"
          >
            Ver projetos
          </a>
        </div>
      </Reveal>
    </section>
  );
}
