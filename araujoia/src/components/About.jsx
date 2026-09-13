import Reveal from "./Reveal";

export default function About() {
  return (
    <section id="sobre" className="pad-x relative overflow-hidden bg-alt py-24 md:py-32">
      <div
        className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full border border-accent/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-10 top-24 h-40 w-40 rounded-full border border-white/10"
        aria-hidden="true"
      />
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-accent">01 — SOBRE</p>
        <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(2rem,5vw,3.6rem)] font-bold tracking-[-0.03em]">
          Tecnologia com propósito.
        </h2>
      </Reveal>
      <div className="mt-10 grid max-w-4xl gap-8 md:grid-cols-2">
        <Reveal>
          <p className="text-lg text-muted">
            A AraújoIA nasceu para transformar necessidades reais em soluções digitais simples, modernas e eficientes.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-lg text-muted">
            Cada projeto é desenvolvido pensando no negócio, nos usuários e nos resultados que a solução precisa gerar.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
