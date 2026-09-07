const highlights = ['Churrasco', 'Carnes', 'Ambiente', 'Experiência']

export function About() {
  return (
    <section id="restaurante" className="bg-ink2 py-24">
      <div className="mx-auto grid max-w-site items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <figure className="overflow-hidden">
          <picture>
            <source type="image/webp" srcSet="/images/about.webp" />
            <img
              src="/images/about.jpg"
              alt="Mesa posta em ambiente de restaurante"
              className="h-[420px] w-full object-cover"
              loading="lazy"
            />
          </picture>
        </figure>
        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.28em] text-gold">O restaurante</p>
          <h2 className="mt-3 font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
            Mais que uma refeição.
            <span className="mt-2 block font-serif text-3xl font-medium italic normal-case tracking-normal text-gold">
              Uma experiência.
            </span>
          </h2>
          <p className="mt-6 max-w-md text-mist/75">
            O Cabana House é uma churrascaria em Estreito – MA. Brasa, carne e um lugar para sentar
            com calma — do almoço ao jantar.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {highlights.map((item) => (
              <li
                key={item}
                className="border border-white/10 px-3 py-3 text-center text-[0.68rem] font-bold uppercase tracking-[0.16em] text-gold"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
