import { mapsEmbedSrc, mapsUrl, restaurant, whatsappUrl } from '../data/restaurant'
import { Button } from './Button'
import { Reveal } from './Reveal'

export function Location() {
  return (
    <section id="localizacao" className="bg-ink2 py-24 md:py-28">
      <div className="mx-auto grid max-w-site gap-10 px-4 md:grid-cols-2 md:px-6">
        <Reveal>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Localização</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            Venha nos conhecer
          </h2>
          <address className="mt-6 not-italic leading-relaxed text-mist/80">
            {restaurant.addressLine}
            <br />
            {restaurant.city}
            <br />
            {restaurant.postalCode}
          </address>
          <p className="mt-4">
            <a className="text-gold transition hover:text-gold2" href={`tel:+${restaurant.phoneE164}`}>
              {restaurant.phoneDisplay}
            </a>
          </p>
          {restaurant.hours ? <p className="mt-3 text-sm text-mist/70">{restaurant.hours}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={mapsUrl()} variant="gold" external>
              Como chegar
            </Button>
            <Button href={whatsappUrl()} variant="ghost" external>
              WhatsApp
            </Button>
          </div>
        </Reveal>
        <div className="overflow-hidden border border-white/10">
          {/* iframe pronto para substituir por embed oficial, se houver. Sem coordenadas inventadas. */}
          <iframe
            title="Mapa do Cabana House em Estreito - MA"
            src={mapsEmbedSrc()}
            className="min-h-[360px] w-full border-0 bg-ink3"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  )
}
