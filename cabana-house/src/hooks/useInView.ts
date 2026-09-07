import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, visible])

  return { ref, visible }
}
