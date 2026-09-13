import Reveal from "./Reveal";
import { services } from "../data/site";

export default function Services() {
  return (
    <section id="servicos" className="pad-x py-24 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-accent">02 — O QUE FAZEMOS</p>
        <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.6rem)] font-bold tracking-[-0.03em]">
          Soluções pensadas para você.
        </h2>
      </Reveal>
      <ul className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((item, i) => (
          <Reveal key={item.n} delay={i * 0.05}>
            <li className="group h-full border border-white/10 bg-surface/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-accent/10">
              <span className="font-display text-2xl font-extrabold text-accent/80">{item.n}</span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-muted">{item.text}</p>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
