import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Reveal from "./Reveal";
import { faqs } from "../data/site";

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="pad-x bg-alt py-24 md:py-32">
      <Reveal>
        <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-[-0.03em]">Perguntas frequentes</h2>
      </Reveal>
      <ul className="mt-10 max-w-3xl divide-y divide-white/10 border-y border-white/10">
        {faqs.map((item, i) => {
          const active = open === i;
          return (
            <li key={item.q}>
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-6 py-5 text-left"
                aria-expanded={active}
                onClick={() => setOpen(active ? -1 : i)}
              >
                <span className="font-display text-lg font-bold md:text-xl">{item.q}</span>
                <span className="text-accent" aria-hidden="true">
                  {active ? "–" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-muted">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
