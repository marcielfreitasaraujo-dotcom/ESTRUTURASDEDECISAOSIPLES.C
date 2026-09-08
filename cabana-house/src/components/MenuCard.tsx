import { restaurant, whatsappUrl } from '../data/restaurant'
import type { MenuItem } from '../data/menu'
import { Picture } from './Picture'

type MenuCardProps = {
  item: MenuItem
}

export function MenuCard({ item }: MenuCardProps) {
  return (
    <article className="group overflow-hidden border border-white/10 bg-ink3 transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-gold">
      <div className="overflow-hidden">
        <Picture
          src={item.image}
          webp={item.imageWebp}
          alt={item.name}
          className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl uppercase tracking-wide">{item.name}</h3>
          <p className="shrink-0 text-sm font-bold text-gold">{item.price}</p>
        </div>
        <p className="mt-2 text-sm text-mist/70">{item.description}</p>
        <a
          href={whatsappUrl(`Olá! Gostaria de saber mais sobre ${item.name} no Cabana House.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center text-[0.7rem] font-bold uppercase tracking-[0.16em] text-gold opacity-100 transition duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          Pedir no WhatsApp · {restaurant.name}
        </a>
      </div>
    </article>
  )
}
