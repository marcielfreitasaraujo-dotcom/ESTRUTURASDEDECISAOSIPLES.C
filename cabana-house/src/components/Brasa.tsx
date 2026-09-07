import { BrandLine } from './BrandLine'
import { Picture } from './Picture'
import { Reveal } from './Reveal'

export function Brasa() {
  return (
    <section id="brasa" className="relative isolate flex min-h-[78vh] items-center overflow-hidden py-28">
      <div className="absolute inset-0 -z-10">
        <Picture
          src="/images/brasa.jpg"
          webp="/images/brasa.webp"
          alt="Carne grelhada na brasa"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
      </div>
      <Reveal className="mx-auto w-full max-w-site px-4 md:px-6">
        <BrandLine className="mb-8 max-w-xs" />
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Destaque</p>
        <h2 className="mt-3 max-w-2xl font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
          O sabor da brasa
        </h2>
        <p className="mt-5 max-w-md text-lg text-mist/80">
          Fogo baixo, corte no ponto e o cheiro que chama a mesa. É isso que a gente serve.
        </p>
      </Reveal>
    </section>
  )
}
