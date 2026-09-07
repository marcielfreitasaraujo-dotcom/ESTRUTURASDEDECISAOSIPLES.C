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
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4 animate-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Imagem ampliada"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center text-2xl text-white"
        aria-label="Fechar"
        onClick={onClose}
      >
        ×
      </button>
      <button
        type="button"
        className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-3xl text-gold"
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
          className="max-h-[80vh] w-full object-contain"
          priority
        />
        <p className="mt-3 text-center text-xs uppercase tracking-[0.16em] text-mist/60">
          {index + 1} / {items.length}
        </p>
      </div>
      <button
        type="button"
        className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-3xl text-gold"
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
