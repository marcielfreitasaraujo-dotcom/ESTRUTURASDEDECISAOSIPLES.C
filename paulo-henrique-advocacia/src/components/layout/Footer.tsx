import Image from "next/image";
import Link from "next/link";
import { footerLinks, site, whatsappUrl } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-navy-deep text-ivory/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <Link href="/#inicio" className="inline-flex max-w-xs items-center">
            <Image
              src="/images/logo-oficial.webp"
              alt="Paulo Henrique de Araújo dos Santos — Advogado"
              width={280}
              height={230}
              className="h-auto w-full max-w-[240px]"
            />
          </Link>
          <p className="mt-6 max-w-md text-sm leading-relaxed">
            Advocacia especializada em Direito Previdenciário, com atendimento
            humanizado, estratégico e personalizado.
          </p>
          <div className="mt-6 flex gap-3">
            <SocialLink
              href={site.instagram}
              label={`Instagram ${site.instagramHandle}`}
            >
              <InstagramGlyph />
            </SocialLink>
            {site.facebook ? (
              <SocialLink href={site.facebook} label="Facebook">
                <FacebookGlyph />
              </SocialLink>
            ) : null}
            <SocialLink href={whatsappUrl()} label="WhatsApp">
              <WhatsAppGlyph />
            </SocialLink>
          </div>
        </div>

        <div className="lg:col-span-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Navegação
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors duration-300 hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Contato
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href={whatsappUrl()}
                className="hover:text-gold"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="break-all hover:text-gold">
                {site.email}
              </a>
            </li>
            <li>{site.address.display}</li>
            <li>{site.hours.display}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © 2026 Paulo Henrique Advocacia. Todos os direitos reservados.
          </p>
          <p className="flex flex-wrap gap-4">
            <Link href="/privacidade" className="hover:text-gold">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-gold">
              Termos de Uso
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center border border-gold/30 text-gold transition-colors duration-300 hover:bg-gold hover:text-navy"
    >
      {children}
    </a>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02Zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22Zm4.51-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z"
      />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M14.5 8.5V6.8c0-.7.5-1.1 1.2-1.1h1.3V3h-2.3C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7Z"
      />
    </svg>
  );
}
