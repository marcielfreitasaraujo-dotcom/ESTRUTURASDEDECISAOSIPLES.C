import { useMemo, useState } from 'react'
import { galleryFilters, galleryItems } from '../data/gallery'
import type { GalleryCategory } from '../data/gallery'
import { Lightbox } from './Lightbox'
import { Picture } from './Picture'
import { Reveal } from './Reveal'

const aspects = ['aspect-[4/5]', 'aspect-square', 'aspect-[16/10]'] as const

export function Gallery() {
  const [filter, setFilter] = useState<'todos' | GalleryCategory>('todos')
  const [open, setOpen] = useState<number | null>(null)

  const items = useMemo(
    () => (filter === 'todos' ? galleryItems : galleryItems.filter((i) => i.category === filter)),
    [filter],
  )

  return (
    <section id="galeria" className="bg-ink2 py-24 md:py-28">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <Reveal>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-gold">Galeria</p>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            Comida, brasa e casa
          </h2>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Categorias da galeria">
          {galleryFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-10 rounded-full px-4 text-[0.7rem] font-bold uppercase tracking-[0.14em] transition duration-200 ${
                filter === f.id ? 'bg-gold text-ink' : 'border border-white/15 text-mist hover:border-gold'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div key={filter} className="mt-10 columns-1 gap-3 animate-fade sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="group relative mb-3 block w-full overflow-hidden break-inside-avoid"
              onClick={() => setOpen(i)}
              aria-label={`Abrir ${item.alt}`}
            >
              <Picture
                src={item.src}
                webp={item.srcWebp}
                alt={item.alt}
                className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${aspects[i % aspects.length]}`}
              />
              <span className="pointer-events-none absolute inset-0 bg-ink/0 transition group-hover:bg-ink/25" />
            </button>
          ))}
        </div>
      </div>
      {open !== null && (
        <Lightbox
          items={items}
          index={open}
          onClose={() => setOpen(null)}
          onPrev={() => setOpen((i) => (i === null ? 0 : (i + items.length - 1) % items.length))}
          onNext={() => setOpen((i) => (i === null ? 0 : (i + 1) % items.length))}
        />
      )}
    </section>
  )
}
