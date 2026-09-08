import type { ReactNode } from 'react'
import { useInView } from '../hooks/useInView'

type RevealProps = {
  children: ReactNode
  className?: string
}

export function Reveal({ children, className = '' }: RevealProps) {
  const { ref, visible } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`transition duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}
