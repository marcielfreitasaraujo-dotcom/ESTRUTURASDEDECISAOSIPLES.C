import { useEffect } from 'react'
import type { GalleryItem } from '../data/gallery'

type LightboxProps = {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ items, index, onClose, onPrev, onNext }: LightboxProps) {
  const item = items[index]

  useEffect(() => {
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Imagem ampliada"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center text-2xl text-white"
        aria-label="Fechar"
        onClick={onClose}
      >
        ×
      </button>
      <button
        type="button"
        className="absolute left-3 grid h-12 w-12 place-items-center text-3xl text-gold"
        aria-label="Imagem anterior"
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
      >
        ‹
      </button>
      <img
        src={item.src}
        alt={item.alt}
        className="max-h-[86vh] max-w-[min(1100px,100%)] object-contain"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          const x = e.changedTouches[0]?.clientX ?? 0
          ;(e.currentTarget as HTMLImageElement).dataset.x = String(x)
        }}
        onTouchEnd={(e) => {
          const start = Number((e.currentTarget as HTMLImageElement).dataset.x || 0)
          const end = e.changedTouches[0]?.clientX ?? start
          if (end - start > 40) onPrev()
          if (start - end > 40) onNext()
        }}
      />
      <button
        type="button"
        className="absolute right-3 grid h-12 w-12 place-items-center text-3xl text-gold"
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
