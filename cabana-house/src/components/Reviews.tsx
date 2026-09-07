import { reviews } from '../data/reviews'

export function Reviews() {
  return (
    <section className="bg-ink py-24">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <p className="text-[0.72rem] font-bold tracking-[0.28em] text-gold">Avaliações</p>
        <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
          O que nossos clientes dizem
        </h2>
        <div className="mt-10 flex flex-wrap items-end gap-8">
          <p className="font-display text-7xl leading-none text-gold">{reviews.ratingValue.toFixed(1)}</p>
          <div>
            <p className="text-gold" aria-label={`${reviews.ratingValue} de 5`}>
              ★★★★☆
            </p>
            <p className="mt-1 text-sm text-mist/70">{reviews.reviewCount} avaliações</p>
          </div>
        </div>
        {reviews.quotes.length === 0 ? (
          <p className="mt-8 max-w-lg text-sm text-mist/55">
            Depoimentos textuais entram nesta área quando houver autorização dos clientes. O
            agregado acima já reflete a avaliação atual.
          </p>
        ) : (
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
