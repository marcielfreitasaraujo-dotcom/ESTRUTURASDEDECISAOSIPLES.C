import Image from "next/image";
import { ButtonLink, WhatsAppButton } from "@/components/ui/ButtonLink";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate min-h-[100svh] overflow-hidden bg-navy-deep text-ivory"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/hero-office.webp"
          alt="Ambiente institucional ilustrativo do escritório — substituir pela fotografia oficial"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/88 to-navy/40" />
        <div className="absolute inset-0 bg-navy/25" />
      </div>

      <div
        className="pointer-events-none absolute top-28 right-[8%] hidden h-40 w-40 border border-gold/25 lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[6%] bottom-24 hidden h-px w-32 bg-gold/40 lg:block"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Advocacia Previdenciária</p>
          <h1 className="mt-6 text-4xl text-ivory sm:text-5xl lg:text-[3.6rem]">
            Seu direito previdenciário merece uma defesa especializada.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/80">
            Orientação jurídica clara, atendimento humanizado e estratégia
            personalizada para proteger seus direitos perante o INSS.
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
      </div>
    </section>
  );
}
