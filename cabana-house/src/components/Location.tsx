import { mapsEmbedSrc, mapsUrl, restaurant, whatsappUrl } from '../data/restaurant'
import { Button } from './Button'

export function Location() {
  return (
    <section id="localizacao" className="bg-ink2 py-24">
      <div className="mx-auto grid max-w-site gap-8 px-4 md:grid-cols-2 md:px-6">
        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.28em] text-gold">Localização</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            Venha nos conhecer
          </h2>
          <address className="mt-6 not-italic text-mist/80">
            {restaurant.addressLine}
            <br />
            {restaurant.city}
            <br />
            {restaurant.postalCode}
          </address>
          <p className="mt-4">
            <a className="text-gold hover:underline" href={`tel:+${restaurant.phoneE164}`}>
              {restaurant.phoneDisplay}
            </a>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={mapsUrl()} variant="gold" external>
              Como chegar
            </Button>
            <Button href={whatsappUrl()} variant="ghost" external>
              WhatsApp
            </Button>
          </div>
        </div>
        <iframe
          title="Mapa do Cabana House em Estreito - MA"
          src={mapsEmbedSrc()}
          className="min-h-[360px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  )
}
