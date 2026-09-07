"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ButtonLink, WhatsAppButton } from "@/components/ui/ButtonLink";
import { ScrollWords } from "@/components/ui/ScrollWords";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (reduced) return;

    const onMove = (event: MouseEvent) => {
      if (!canHover) return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty("--mx", x.toFixed(3));
      node.style.setProperty("--my", y.toFixed(3));
    };

    const onScroll = () => {
      const rect = node.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(rect.height, 1)),
      );
      node.style.setProperty("--sy", progress.toFixed(3));
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      id="inicio"
      ref={ref}
      className="hero-track relative isolate min-h-[100svh] overflow-hidden bg-navy-deep text-ivory"
    >
      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-4 pt-28 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-20">
        <div className="max-w-xl">
          <p className="eyebrow">Advocacia Previdenciária</p>
          <h1 className="hero-title mt-6 font-serif text-4xl leading-tight text-ivory sm:text-5xl lg:text-[3.45rem]">
            <ScrollWords
              text="Seu direito previdenciário merece uma defesa especializada."
              mouse
              immediate
              stagger={150}
            />
          </h1>
          <p className="hero-lead mt-6 text-lg leading-relaxed text-ivory/80">
            <ScrollWords
              text="Orientação jurídica clara, atendimento humanizado e estratégia personalizada para proteger seus direitos perante o INSS."
              immediate
              stagger={85}
            />
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton>Solicitar atendimento</WhatsAppButton>
            <ButtonLink href="/#escritorio" variant="outline-light">
              Conhecer o escritório
            </ButtonLink>
          </div>
          <p className="mt-8 text-sm text-ivory/55">
            Estreito - MA · Atendimento online em todo o Brasil
          </p>
        </div>

        <div className="hero-portrait relative mx-auto w-full max-w-md overflow-hidden bg-navy-deep lg:max-w-none">
          <div className="gold-frame overflow-hidden bg-navy-deep">
            <Image
              src="/images/paulo-henrique.webp"
              alt="Paulo Henrique, advogado previdenciário em Estreito - MA"
              width={629}
              height={627}
              priority
              quality={90}
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="relative z-10 block h-auto w-full scale-[1.06] bg-navy-deep object-cover object-[center_18%] lg:min-h-[520px] lg:object-[center_12%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
