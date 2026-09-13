import { motion, useReducedMotion } from "framer-motion";
import { brand, links } from "../data/site";
import HeroField from "./HeroField";

export default function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section id="topo" className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-16 pt-28 md:items-center md:pb-24">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#0a1211_0%,#0f1a18_42%,#080d0c_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-80">
        <HeroField />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_78%_16%,rgba(61,190,180,0.16),transparent_55%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-bg/40 to-bg" />

      <div className="pad-x relative w-full max-w-4xl">
        <motion.p className="font-display text-[clamp(3rem,12vw,7rem)] font-extrabold leading-[0.9] tracking-[-0.05em] text-accent" {...fade(0.05)}>
          {brand.name}
        </motion.p>
        <motion.h1
          className="mt-6 max-w-[16ch] font-display text-[clamp(1.6rem,4vw,2.8rem)] font-bold leading-tight tracking-[-0.03em]"
          {...fade(0.16)}
        >
          Tecnologia feita para o seu negócio.
        </motion.h1>
        <motion.p className="mt-5 max-w-[38ch] text-lg text-muted" {...fade(0.26)}>
          Sites, sistemas e soluções digitais desenvolvidos para transformar ideias em resultados.
        </motion.p>
        <motion.div className="mt-8 flex flex-wrap gap-3" {...fade(0.36)}>
          <a
            href="#projetos"
            className="inline-flex min-h-12 items-center rounded-[2px] bg-accent px-5 font-semibold text-bg shadow-glow transition hover:-translate-y-0.5 hover:bg-hover"
          >
            Conheça nossos projetos
          </a>
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center rounded-[2px] border border-white/15 px-5 font-semibold text-ink transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent/10"
          >
            Fale com a AraújoIA
          </a>
        </motion.div>
      </div>

      <a
        href="#intro"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.68rem] font-semibold tracking-[0.16em] text-muted"
      >
        SCROLL PARA EXPLORAR ↓
      </a>
    </section>
  );
}
