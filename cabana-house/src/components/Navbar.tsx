import { useEffect, useState } from 'react'
import { restaurant, whatsappUrl } from '../data/restaurant'
import { navLinks } from '../data/nav'

type NavbarProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Navbar({ open, onOpenChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
          scrolled || open
            ? 'border-b border-white/10 bg-ink/85 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-4 py-3 md:px-6">
          <a href="#inicio" className="flex items-center gap-3" aria-label="Cabana House — início">
            <img src="/brand/logo.svg" alt="" width={168} height={44} className="h-11 w-auto" />
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Seções do site">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-mist/80 transition hover:text-gold"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-full bg-gold px-5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-gold2 lg:inline-flex"
          >
            WhatsApp
          </a>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => onOpenChange(!open)}
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-5 bg-gold transition duration-300 ${
                  open ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] block h-0.5 w-5 bg-gold transition duration-300 ${
                  open ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] block h-0.5 w-5 bg-gold transition duration-300 ${
                  open ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Fora do <header>: o backdrop-filter dele criaria um bloco de contenção para position: fixed. */}
      <div
        id="menu-mobile"
        className={`fixed inset-0 z-40 bg-ink transition duration-300 lg:hidden ${
          open ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'
        }`}
        {...(!open ? { inert: true } : {})}
      >
        <nav
          className={`flex h-full flex-col justify-center gap-1 overflow-y-auto px-8 pb-16 pt-24 transition duration-500 ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
          aria-label="Menu móvel"
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => onOpenChange(false)}
              className="border-b border-white/10 py-4 font-display text-2xl uppercase tracking-[0.12em] text-mist transition hover:text-gold"
            >
              {l.label}
            </a>
          ))}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-gold text-sm font-bold uppercase tracking-[0.16em] text-ink"
          >
            WhatsApp · {restaurant.phoneDisplay}
          </a>
        </nav>
      </div>
    </>
  )
}
