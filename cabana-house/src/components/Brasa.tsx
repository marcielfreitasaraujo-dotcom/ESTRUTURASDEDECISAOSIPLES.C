import { BrandLine } from './BrandLine'

export function Brasa() {
  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden py-28">
      <div className="absolute inset-0 -z-10">
        <picture>
          <source type="image/webp" srcSet="/images/brasa.webp" />
          <img
            src="/images/brasa.jpg"
            alt="Carne grelhada na brasa"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </picture>
        <div className="absolute inset-0 bg-ink/70" />
      </div>
      <div className="mx-auto max-w-site px-4 md:px-6">
        <BrandLine className="mb-8 max-w-xs" />
        <p className="text-[0.72rem] font-bold tracking-[0.28em] text-gold">Destaque</p>
        <h2 className="mt-3 max-w-2xl font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
          O sabor da brasa
        </h2>
        <p className="mt-5 max-w-md text-lg text-mist/80">
          Fogo baixo, corte no ponto e o cheiro que chama a mesa. É isso que a gente serve.
        </p>
      </div>
    </section>
  )
}
