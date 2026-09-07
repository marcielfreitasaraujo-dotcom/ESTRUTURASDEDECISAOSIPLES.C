import { useEffect, useRef, useState } from 'react'
import { Picture } from './Picture'

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const onScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const view = window.innerHeight
      if (rect.bottom < 0 || rect.top > view) return
      const progress = (view - rect.top) / (view + rect.height)
      setOffset((progress - 0.5) * 28)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative isolate min-h-[72vh] overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ transform: `translate3d(0, ${offset}px, 0)` }}>
        <Picture
          src="/images/experience.jpg"
          webp="/images/experience.webp"
          alt="Salão do restaurante"
          className="h-[120%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/75" />
      </div>
      <div className="mx-auto flex min-h-[72vh] max-w-site items-end px-4 py-24 md:px-6">
        <div>
          <h2 className="font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
            Um lugar para comer bem.
          </h2>
          <p className="mt-4 font-serif text-3xl italic text-gold">E aproveitar o momento.</p>
        </div>
      </div>
    </section>
  )
}
