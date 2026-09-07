import { reviews } from '../data/reviews'
import { ratingLabel } from '../data/restaurant'
import { Reveal } from './Reveal'

function Stars({ value }: { value: number }) {
  return (
    <p className="text-gold" aria-hidden="true">
      {'★★★★★'.slice(0, Math.round(value)).padEnd(5, '☆')}
    </p>
  )
}

export function Reviews() {
  return (
    <section className="bg-ink py-24 md:py-28">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <Reveal>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Avaliações</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            O que nossos clientes dizem
          </h2>
        </Reveal>
        <div className="mt-10 inline-flex flex-wrap items-end gap-8 border border-white/10 bg-ink3 px-8 py-8">
          <p className="font-display text-7xl leading-none text-gold">{ratingLabel()}</p>
          <div>
            <Stars value={reviews.ratingValue} />
            <p className="mt-1 text-sm text-mist/70" aria-label={`${ratingLabel()} de 5, ${reviews.reviewCount} avaliações`}>
              {reviews.reviewCount} avaliações
            </p>
          </div>
        </div>
        {reviews.quotes.length === 0 ? null : (
          <div className="mt-10 flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
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
