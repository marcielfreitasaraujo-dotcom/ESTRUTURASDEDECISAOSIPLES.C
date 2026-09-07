import { useEffect, useState } from 'react'
import { restaurant, whatsappUrl } from '../data/restaurant'

const links = [
  { href: '#inicio', label: 'Início' },
  { href: '#restaurante', label: 'O Restaurante' },
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#localizacao', label: 'Localização' },
  { href: '#contato', label: 'Contato' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
        scrolled || open
          ? 'bg-ink/85 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)] border-b border-white/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-4 py-3 md:px-6">
        <a href="#inicio" className="relative z-20 flex items-center gap-3" aria-label="Cabana House — início">
          <img src="/brand/logo.svg" alt="" width={168} height={44} className="h-11 w-auto" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Seções do site">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.72rem] font-bold tracking-[0.16em] uppercase text-mist/80 transition hover:text-gold"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-20 hidden min-h-11 items-center rounded-full bg-gold px-5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-gold2 sm:inline-flex"
        >
          WhatsApp
        </a>

        <button
          type="button"
          className="relative z-20 grid h-11 w-11 place-items-center lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className={`block h-0.5 w-5 bg-gold transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`mt-1.5 block h-0.5 w-5 bg-gold transition ${open ? 'opacity-0' : ''}`} />
          <span className={`mt-1.5 block h-0.5 w-5 bg-gold transition ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        id="menu-mobile"
        className={`lg:hidden ${open ? 'block' : 'hidden'} border-t border-white/10 bg-ink`}
      >
        <nav className="flex flex-col px-5 py-4" aria-label="Menu móvel">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-mist"
            >
              {l.label}
            </a>
          ))}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-gold text-sm font-bold uppercase tracking-[0.16em] text-ink"
          >
            WhatsApp · {restaurant.phoneDisplay}
          </a>
        </nav>
      </div>
    </header>
  )
}
