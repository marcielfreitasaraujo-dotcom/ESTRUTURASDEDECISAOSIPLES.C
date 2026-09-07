"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqItems } from "@/lib/faq";

export function Faq({ hideHeading = false }: { hideHeading?: boolean }) {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-paper px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {hideHeading ? null : (
        <Reveal>
          <SectionHeading
            eyebrow="Dúvidas"
            title="Perguntas frequentes"
            subtitle="Respostas objetivas para as dúvidas mais comuns. Se a sua situação for específica, fale conosco pelo WhatsApp."
            align="center"
          />
        </Reveal>
        )}

        <div className="mt-12 border-y border-line">
          {faqItems.map((item, index) => {
            const isOpen = open === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <div key={item.question} className="faq-item">
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-xl text-navy"
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    {item.question}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-gold transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`faq-panel ${isOpen ? "open" : ""}`}
                >
                  <p className="overflow-hidden pb-5 text-sm leading-relaxed text-muted">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
