import { reviews } from '../data/reviews'
import { mapsUrl, ratingLabel } from '../data/restaurant'
import { Reveal } from './Reveal'

function Stars({ value }: { value: number }) {
  return (
    <p className="text-xl tracking-[0.28em] text-gold" aria-hidden="true">
      {'★★★★★'.slice(0, Math.round(value)).padEnd(5, '☆')}
    </p>
  )
}

export function Reviews() {
  const percent = Math.round((reviews.ratingValue / 5) * 100)

  return (
    <section id="avaliacoes" className="bg-ink py-24 md:py-28">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Avaliações</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            O que nossos clientes dizem
          </h2>
        </Reveal>

        <Reveal className="mt-10">
          <div className="grid items-stretch gap-px border border-white/10 bg-white/10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <div className="bg-ink3 p-8 md:p-10">
              <div className="flex items-end gap-4">
                <p className="font-display text-7xl leading-none text-gold">{ratingLabel()}</p>
                <p className="pb-2 text-sm text-mist/50">de 5</p>
              </div>
              <div className="mt-4">
                <Stars value={reviews.ratingValue} />
              </div>
              <div
                className="mt-5 h-px w-full bg-white/10"
                role="img"
                aria-label={`Nota ${ratingLabel()} de 5 no Google, com base em ${reviews.reviewCount} avaliações`}
              >
                <div className="h-px bg-gold" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-5 text-sm text-mist/70">
                {reviews.reviewCount} avaliações no Google
              </p>
            </div>

            <div className="flex flex-col justify-between gap-8 bg-ink3 p-8 md:p-10">
              <div>
                <p className="font-serif text-2xl italic leading-snug text-mist sm:text-3xl">
                  Nota dada por quem já sentou à mesa.
                </p>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist/65">
                  Publicamos aqui apenas avaliações reais. Os depoimentos escritos entram nesta área
                  assim que o restaurante autorizar a divulgação — até lá, a nota completa pode ser
                  conferida direto no Google.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={mapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-gold2"
                >
                  Ver no Google
                </a>
                <a
                  href={mapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-mist transition hover:border-gold hover:text-gold"
                >
                  Deixar avaliação
                </a>
              </div>
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
