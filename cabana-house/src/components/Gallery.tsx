import { useMemo, useState } from 'react'
import { galleryFilters, galleryItems } from '../data/gallery'
import type { GalleryCategory } from '../data/gallery'
import { Lightbox } from './Lightbox'

export function Gallery() {
  const [filter, setFilter] = useState<'todos' | GalleryCategory>('todos')
  const [open, setOpen] = useState<number | null>(null)

  const items = useMemo(
    () => (filter === 'todos' ? galleryItems : galleryItems.filter((i) => i.category === filter)),
    [filter],
  )

  return (
    <section id="galeria" className="bg-ink2 py-24">
      <div className="mx-auto max-w-site px-4 md:px-6">
        <p className="text-[0.72rem] font-bold tracking-[0.28em] text-gold">Galeria</p>
        <h2 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-5xl">
          Comida, brasa e casa
        </h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {galleryFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`min-h-10 rounded-full px-4 text-[0.7rem] font-bold uppercase tracking-[0.14em] ${
                filter === f.id ? 'bg-gold text-ink' : 'border border-white/15 text-mist'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-10 columns-1 gap-3 sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="mb-3 block w-full overflow-hidden"
              onClick={() => setOpen(i)}
              aria-label={`Abrir ${item.alt}`}
            >
              <picture>
                <source type="image/webp" srcSet={item.srcWebp} />
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full object-cover transition duration-500 hover:scale-[1.03]"
                  loading="lazy"
                />
              </picture>
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
