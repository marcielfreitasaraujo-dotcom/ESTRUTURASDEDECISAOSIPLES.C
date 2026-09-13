import Reveal from "./Reveal";
import { stack } from "../data/site";

export default function Technology() {
  return (
    <section id="tecnologia" className="pad-x py-24 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-accent">05 — TECNOLOGIA</p>
        <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-[-0.03em]">
          Ferramentas no lugar certo.
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <ul className="mt-12 flex flex-wrap gap-3">
          {stack.map((item) => (
            <li
              key={item}
              className="border border-white/10 px-4 py-2 text-sm font-medium text-ink/90 transition hover:border-accent hover:text-accent"
            >
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
