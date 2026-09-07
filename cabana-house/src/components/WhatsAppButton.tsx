import { restaurant, whatsappUrl } from '../data/restaurant'

type WhatsAppButtonProps = {
  /** Some enquanto o menu mobile está aberto para não cobrir o CTA do menu. */
  hidden?: boolean
}

export function WhatsAppButton({ hidden = false }: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1f9e54] text-white shadow-lg transition duration-200 animate-pulseSoft md:bottom-6 md:right-6 ${
        hidden ? 'pointer-events-none scale-90 opacity-0' : 'opacity-100'
      }`}
      aria-label="Falar no WhatsApp com o Cabana House"
      {...(hidden ? { tabIndex: -1, 'aria-hidden': true } : {})}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19.05 4.91A9.9 9.9 0 0 0 12.04 2C6.5 2 2.02 6.48 2.02 12c0 1.77.46 3.49 1.34 5.01L2 22l5.14-1.34A9.96 9.96 0 0 0 12.04 22c5.52 0 10.02-4.48 10.02-10 0-2.67-1.04-5.18-2.99-7.09zM12.04 20.2a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3.05.8.82-2.97-.2-.31A8.18 8.18 0 0 1 3.84 12c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4a8.16 8.16 0 0 1 2.4 5.8c0 4.52-3.68 8.2-8.2 8.2zm4.49-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.73 2.64 4.2 3.7.59.25 1.04.41 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.14-1.17-.06-.11-.22-.16-.47-.29z"
        />
      </svg>
      <span className="sr-only">{restaurant.phoneDisplay}</span>
    </a>
  )
}
