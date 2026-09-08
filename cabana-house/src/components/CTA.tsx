import { whatsappUrl } from '../data/restaurant'
import { Button } from './Button'
import { Picture } from './Picture'

export function CTA() {
  return (
    <section id="contato" className="relative isolate overflow-hidden py-28 md:py-32">
      <div className="absolute inset-0 -z-10">
        <Picture
          src="/images/cta.jpg"
          webp="/images/cta.webp"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/80" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_50%,transparent_0%,rgba(5,5,5,0.9)_100%)]" />
      </div>
      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide sm:text-6xl">
          Seu próximo sabor favorito pode estar aqui.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="#cardapio">Ver cardápio</Button>
          <Button href={whatsappUrl()} variant="ghost" external>
            Falar no WhatsApp
          </Button>
        </div>
      </div>
    </section>
  )
}
