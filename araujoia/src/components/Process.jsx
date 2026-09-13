import Reveal from "./Reveal";
import { steps } from "../data/site";

export default function Process() {
  return (
    <section id="processo" className="pad-x py-24 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-accent">04 — COMO TRABALHAMOS</p>
        <h2 className="mt-4 max-w-[12ch] font-display text-[clamp(2rem,5vw,3.6rem)] font-bold tracking-[-0.03em]">
          Do problema à solução.
        </h2>
      </Reveal>
      <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
        <span
          className="pointer-events-none absolute left-[1.15rem] top-3 hidden h-[2px] bg-accent/40 md:left-0 md:right-0 md:top-4 md:block"
          aria-hidden="true"
        />
        {steps.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.08} className="relative">
            <li>
              <span className="relative z-10 mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-accent bg-bg font-display text-xs font-bold text-accent">
                {step.n}
              </span>
              <h3 className="font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 max-w-[28ch] text-muted">{step.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
