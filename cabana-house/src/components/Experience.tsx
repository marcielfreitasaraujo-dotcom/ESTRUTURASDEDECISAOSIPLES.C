import { useEffect, useState } from 'react'

export function Experience() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const onScroll = () => setOffset(window.scrollY * 0.08)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ transform: `translateY(${offset * 0.15}px)` }}>
        <picture>
          <source type="image/webp" srcSet="/images/experience.webp" />
          <img
            src="/images/experience.jpg"
            alt="Salão do restaurante"
            className="h-[120%] w-full object-cover"
            loading="lazy"
          />
        </picture>
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
