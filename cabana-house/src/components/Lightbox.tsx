import { useEffect, useRef } from 'react'
import type { GalleryItem } from '../data/gallery'
import { Picture } from './Picture'

type LightboxProps = {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ items, index, onClose, onPrev, onNext }: LightboxProps) {
  const item = items[index]
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Os callbacks são recriados a cada render da galeria; guardá-los em ref evita
  // remontar o efeito (e devolver o foco) a cada troca de imagem.
  const handlers = useRef({ onClose, onPrev, onNext })
  useEffect(() => {
    handlers.current = { onClose, onPrev, onNext }
  })

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlers.current.onClose()
      if (e.key === 'ArrowLeft') handlers.current.onPrev()
      if (e.key === 'ArrowRight') handlers.current.onNext()
      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      trigger?.focus?.({ preventScroll: true })
    }
  }, [])

  if (!item) return null

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex animate-fade items-center justify-center bg-ink/95 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Imagem ampliada"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 text-2xl text-white transition hover:border-gold hover:text-gold"
        aria-label="Fechar"
        onClick={onClose}
      >
        ×
      </button>
      <button
        type="button"
        className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 text-3xl text-gold transition hover:border-gold hover:bg-gold hover:text-ink"
        aria-label="Imagem anterior"
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
      >
        ‹
      </button>
      <div
        className="max-h-[86vh] max-w-[min(1100px,100%)]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          const x = e.changedTouches[0]?.clientX ?? 0
          ;(e.currentTarget as HTMLDivElement).dataset.x = String(x)
        }}
        onTouchEnd={(e) => {
          const start = Number((e.currentTarget as HTMLDivElement).dataset.x || 0)
          const end = e.changedTouches[0]?.clientX ?? start
          if (end - start > 40) onPrev()
          if (start - end > 40) onNext()
        }}
      >
        <Picture
          src={item.src}
          webp={item.srcWebp}
          alt={item.alt}
          className="max-h-[74vh] w-full object-contain"
          priority
        />
        <p className="mt-4 text-center text-sm text-mist/70">{item.alt}</p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.16em] text-mist/45">
          {index + 1} / {items.length}
        </p>
      </div>
      <button
        type="button"
        className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 text-3xl text-gold transition hover:border-gold hover:bg-gold hover:text-ink"
        aria-label="Próxima imagem"
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
      >
        ›
      </button>
    </div>
  )
}
