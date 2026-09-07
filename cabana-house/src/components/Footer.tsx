import { restaurant, whatsappUrl } from '../data/restaurant'
import { navLinks } from '../data/nav'
import { BrandLine } from './BrandLine'

export function Footer() {
  return (
    <footer className="bg-ink">
      <BrandLine />
      <div className="mx-auto grid max-w-site gap-10 px-4 py-16 md:grid-cols-3 md:px-6">
        <div>
          <img src="/brand/logo.svg" alt="Cabana House" width={180} height={46} className="h-12 w-auto" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">{restaurant.tagline}</p>
          <p className="mt-4 text-sm text-mist/70">
            {restaurant.addressLine}
            <br />
            {restaurant.city}
          </p>
          <a
            className="mt-2 inline-flex min-h-11 items-center text-gold transition hover:text-gold2"
            href={`tel:+${restaurant.phoneE164}`}
          >
            {restaurant.phoneDisplay}
          </a>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">Menu</p>
          <ul className="mt-2 text-sm text-mist/80">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-11 items-center transition hover:text-gold">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gold">Contato</p>
          <p className="mt-4 text-sm text-mist/70">
            Pedidos e informações pelo WhatsApp.
            <br />
            {restaurant.phoneDisplay}
          </p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-gold2"
          >
            WhatsApp
          </a>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-mist/45">
        © 2026 Cabana House. Todos os direitos reservados.
      </p>
    </footer>
  )
}
