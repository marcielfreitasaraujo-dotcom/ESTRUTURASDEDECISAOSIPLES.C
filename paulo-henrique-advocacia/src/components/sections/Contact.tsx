import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppButton } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site";

export function Contact({ hideHeading = false }: { hideHeading?: boolean }) {
  return (
    <section id="contato" className="bg-ivory px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-w-0 max-w-7xl gap-12 lg:grid-cols-2">
        <Reveal className="min-w-0">
          {hideHeading ? null : (
          <SectionHeading
            eyebrow="Contato"
            title="Entre em contato"
            subtitle="Escolha o canal mais confortável para você. O WhatsApp é o caminho mais direto para iniciar o atendimento."
          />
          )}

          <ul className="mt-10 space-y-6">
            <Info
              icon={Phone}
              label="WhatsApp"
              value={site.phoneDisplay}
              href={`https://wa.me/${site.whatsappNumber}`}
            />
            <Info
              icon={Mail}
              label="E-mail"
              value={site.email}
              href={`mailto:${site.email}`}
            />
            <Info
              icon={MapPin}
              label="Endereço"
              value={
                <>
                  {site.address.street} - {site.address.neighborhood}
                  <br />
                  {site.address.city} - {site.address.region}
                </>
              }
              href={site.google.mapsLink}
            />
            <Info
              icon={Clock}
              label="Horário"
              value={
                <>
                  {site.hours.displayLines[0]}
                  <br />
                  {site.hours.displayLines[1]}
                </>
              }
            />
          </ul>

          <div className="mt-10">
            <WhatsAppButton>Abrir conversa no WhatsApp</WhatsAppButton>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="h-full min-h-[360px] overflow-hidden border border-line bg-paper">
            <iframe
              title="Mapa do escritório Paulo Henrique Advocacia em Estreito - MA"
              src={site.google.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[360px] w-full grayscale-[35%] contrast-[1.05]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-gold/40 text-gold">
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <span>
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold">
          {label}
        </span>
        <span className="mt-1 block break-all text-navy">{value}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          className="flex items-start gap-4 transition-colors duration-300 hover:text-gold"
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {content}
        </a>
      </li>
    );
  }

  return <li className="flex items-start gap-4">{content}</li>;
}
