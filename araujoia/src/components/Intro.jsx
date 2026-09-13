import Reveal from "./Reveal";

export default function Intro() {
  return (
    <section id="intro" className="pad-x border-t border-white/10 py-28 md:py-36">
      <Reveal>
        <h2 className="max-w-[14ch] font-display text-[clamp(2.4rem,7vw,5.2rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
          Não criamos apenas sites.
          <span className="mt-2 block text-accent">Criamos soluções digitais.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.12} className="mt-8 max-w-xl">
        <p className="text-lg text-muted">
          Da primeira ideia ao produto final, desenvolvemos experiências digitais pensadas para as necessidades de cada negócio.
        </p>
      </Reveal>
    </section>
  );
}
