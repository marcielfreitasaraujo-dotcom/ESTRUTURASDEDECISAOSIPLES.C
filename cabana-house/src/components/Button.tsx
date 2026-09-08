import type { ReactNode } from 'react'

type ButtonProps = {
  href: string
  children: ReactNode
  variant?: 'gold' | 'ghost' | 'wa'
  className?: string
  external?: boolean
}

export function Button({ href, children, variant = 'gold', className = '', external }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center min-h-12 px-6 text-[0.78rem] font-bold tracking-[0.18em] uppercase rounded-full transition duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0'
  const styles = {
    gold: 'bg-gold text-ink hover:bg-gold2 shadow-gold',
    ghost: 'border border-white/30 text-mist hover:border-gold hover:text-gold bg-transparent',
    wa: 'bg-[#1f9e54] text-white hover:bg-[#188447]',
  } as const
  return (
    <a
      href={href}
      className={`${base} ${styles[variant]} ${className}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
