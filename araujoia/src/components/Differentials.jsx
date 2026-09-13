import Reveal from "./Reveal";
import { reasons } from "../data/site";

export default function Differentials() {
  return (
    <section className="pad-x relative overflow-hidden border-y border-white/10 bg-alt py-24 md:py-32">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(61,190,180,0.12),transparent_60%)]" aria-hidden="true" />
      <Reveal>
        <h2 className="font-display text-[clamp(2.2rem,6vw,4.4rem)] font-extrabold tracking-[-0.04em]">
          Por que AraújoIA?
        </h2>
      </Reveal>
      <ul className="mt-14 grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
        {reasons.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.05} className={i === 4 ? "lg:col-span-1" : ""}>
            <li className="h-full bg-alt p-7">
              <h3 className="font-display text-2xl font-bold">{item.title}</h3>
              <p className="mt-3 text-muted">{item.text}</p>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
