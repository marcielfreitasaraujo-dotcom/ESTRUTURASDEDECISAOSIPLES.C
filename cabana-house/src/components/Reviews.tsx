import { reviews } from '../data/reviews'
import { mapsUrl, ratingLabel } from '../data/restaurant'
import { Reveal } from './Reveal'

function Stars({ value }: { value: number }) {
  return (
    <p className="text-lg tracking-[0.3em] text-gold" aria-hidden="true">
      {'★★★★★'.slice(0, Math.round(value)).padEnd(5, '☆')}
    </p>
  )
}

export function Reviews() {
  return (
    <section className="bg-ink py-24 md:py-28">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Avaliações</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            O que nossos clientes dizem
          </h2>
        </Reveal>

        <Reveal className="mt-10">
          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-ink3 p-8">
              <p className="font-display text-6xl leading-none text-gold">{ratingLabel()}</p>
              <div className="mt-3">
                <Stars value={reviews.ratingValue} />
              </div>
              <p className="mt-2 text-sm text-mist/70">
                <span className="sr-only">Nota </span>
                {ratingLabel()} de 5 no Google
              </p>
            </div>

            <div className="bg-ink3 p-8">
              <p className="font-display text-6xl leading-none">{reviews.reviewCount}</p>
              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-mist/70">Avaliações</p>
              <p className="mt-2 text-sm text-mist/60">Quem parou aqui deixou registro.</p>
            </div>

            <div className="flex flex-col justify-between gap-6 bg-ink3 p-8">
              <p className="text-sm leading-relaxed text-mist/70">
                Os depoimentos completos serão publicados nesta área assim que o restaurante autorizar
                a divulgação.
              </p>
              <a
                href={mapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gold transition hover:text-gold2"
              >
                Ver no Google
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </Reveal>

        {reviews.quotes.length === 0 ? null : (
          <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
            {reviews.quotes.map((q) => (
              <blockquote
                key={q.id}
                className="min-w-[80%] snap-start border border-white/10 bg-ink3 p-6 md:min-w-0"
              >
                <p className="font-serif text-xl italic text-mist">“{q.text}”</p>
                <footer className="mt-4 text-xs uppercase tracking-[0.14em] text-gold">{q.author}</footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
