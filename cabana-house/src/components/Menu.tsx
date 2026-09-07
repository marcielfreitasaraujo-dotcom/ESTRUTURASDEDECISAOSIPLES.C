import { useMemo, useState } from 'react'
import { menuFilters, menuItems } from '../data/menu'
import type { MenuCategory } from '../data/menu'
import { MenuCard } from './MenuCard'
import { Reveal } from './Reveal'

export function Menu() {
  const [filter, setFilter] = useState<'todos' | MenuCategory>('todos')

  const items = useMemo(
    () => (filter === 'todos' ? menuItems : menuItems.filter((i) => i.category === filter)),
    [filter],
  )

  return (
    <section id="cardapio" className="bg-ink py-24 md:py-28">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <Reveal>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Cardápio</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            Nosso cardápio
          </h2>
          <p className="mt-3 max-w-lg text-sm text-mist/60">
            Confira as categorias e fale no WhatsApp para valores e disponibilidade do dia.
          </p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Categorias do cardápio">
          {menuFilters.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`min-h-11 rounded-full px-4 text-[0.72rem] font-bold uppercase tracking-[0.14em] transition duration-200 ${
                  active ? 'bg-gold text-ink' : 'border border-white/15 text-mist hover:border-gold'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <div key={filter} className="mt-10 grid animate-fade gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
