"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { site } from "@/lib/site";
import { testimonials } from "@/lib/testimonials";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [paused]);

  const current = testimonials[index];

  return (
    <section
      id="depoimentos"
      className="bg-navy px-4 py-24 text-ivory sm:px-6 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="eyebrow mx-auto justify-center">Depoimentos</p>
        <h2 className="mt-5 text-3xl text-ivory sm:text-4xl">
          A confiança de quem já contou com nosso trabalho
        </h2>

        <div className="mt-8 flex items-center justify-center gap-2 text-gold" aria-hidden>
          {Array.from({ length: 5 }).map((_, star) => (
            <Star key={star} className="h-4 w-4 fill-gold text-gold" />
          ))}
        </div>
        <p className="mt-2 text-sm text-ivory/70">
          {site.google.ratingDisplay} · {site.google.reviewCount} avaliações no
          Google
        </p>

        <div
          className="relative mt-12 min-h-[180px]"
          aria-live="polite"
          aria-atomic="true"
        >
          <blockquote>
            <p className="font-serif text-2xl leading-snug text-ivory sm:text-3xl">
              “{current.quote}”
            </p>
            <footer className="mt-6 text-sm tracking-wide text-gold/90">
              {current.source}
            </footer>
          </blockquote>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() =>
              setIndex(
                (currentIndex) =>
                  (currentIndex - 1 + testimonials.length) %
                  testimonials.length,
              )
            }
            className="inline-flex h-11 w-11 items-center justify-center border border-gold/40 text-gold transition-colors duration-300 hover:bg-gold hover:text-navy"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="flex gap-2" role="tablist" aria-label="Depoimentos">
            {testimonials.map((item, itemIndex) => (
              <button
                key={item.quote}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={`Mostrar depoimento ${itemIndex + 1}`}
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  itemIndex === index ? "bg-gold" : "bg-ivory/30"
                }`}
                onClick={() => setIndex(itemIndex)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setIndex((currentIndex) => (currentIndex + 1) % testimonials.length)
            }
            className="inline-flex h-11 w-11 items-center justify-center border border-gold/40 text-gold transition-colors duration-300 hover:bg-gold hover:text-navy"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-10">
          <ButtonLink
            href={site.google.reviewsUrl}
            variant="outline-light"
            external
          >
            Ver avaliações
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
