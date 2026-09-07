import { Button } from './Button'
import { Picture } from './Picture'

export function Hero() {
  return (
    <section id="inicio" className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Picture
          src="/images/hero.jpg"
          webp="/images/hero.webp"
          alt=""
          priority
          className="h-full w-full object-cover animate-ken"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,transparent_35%,rgba(5,5,5,0.75)_100%)]" />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-site flex-col justify-end px-4 pb-20 pt-32 md:px-6 md:pb-24">
        <p className="animate-rise font-display text-sm font-semibold uppercase tracking-[0.42em] text-gold">
          Cabana House
        </p>
        <h1 className="animate-rise mt-4 max-w-4xl font-display text-5xl font-semibold uppercase leading-[0.92] tracking-wide text-white delay-100 sm:text-7xl lg:text-[5.2rem]">
          Sabor que merece uma parada.
        </h1>
        <p className="animate-rise mt-5 max-w-xl text-lg text-mist/80 delay-150">
          Churrasco, sabor e uma experiência especial em Estreito – MA.
        </p>
        <div className="animate-rise mt-8 flex flex-wrap gap-3 delay-200">
          <Button href="#cardapio">Ver cardápio</Button>
          <Button href="#localizacao" variant="ghost">
            Como chegar
          </Button>
        </div>
        <a
          href="#restaurante"
          className="mt-14 inline-flex w-fit flex-col items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-mist/60"
          aria-label="Rolar para o restaurante"
        >
          <span>Scroll</span>
          <span className="block h-8 w-px bg-gold/70" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
