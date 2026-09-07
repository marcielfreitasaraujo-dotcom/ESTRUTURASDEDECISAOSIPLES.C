import { Picture } from './Picture'
import { Reveal } from './Reveal'

const highlights = ['Churrasco', 'Carnes', 'Ambiente', 'Experiência']

export function About() {
  return (
    <section id="restaurante" className="bg-ink2 py-24 md:py-28">
      <div className="mx-auto grid max-w-site items-center gap-12 px-4 md:grid-cols-2 md:px-6 lg:gap-16">
        <figure className="gold-frame overflow-hidden">
          <Picture
            src="/images/about.jpg"
            webp="/images/about.webp"
            alt="Ambiente interno com madeira e iluminação quente"
            className="h-[420px] w-full object-cover md:h-[520px]"
          />
        </figure>
        <Reveal>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">O restaurante</p>
          <h2 className="mt-3 font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
            Mais que uma refeição.
            <span className="mt-3 block font-serif text-3xl font-medium italic normal-case tracking-normal text-gold sm:text-4xl">
              Uma experiência.
            </span>
          </h2>
          <p className="mt-6 max-w-md text-mist/75">
            O Cabana House é uma churrascaria em Estreito – MA. Brasa, carne e um lugar para sentar
            com calma — do almoço ao jantar, na Av. Chico Brito.
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
        </Reveal>
      </div>
    </section>
  )
}
