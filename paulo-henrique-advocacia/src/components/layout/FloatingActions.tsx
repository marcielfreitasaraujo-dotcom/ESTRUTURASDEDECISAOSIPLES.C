"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float group fixed right-6 bottom-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#128C3A] px-3 py-3 text-white transition-transform duration-300 hover:scale-[1.03] sm:px-4"
        aria-label="Fale com nossa equipe pelo WhatsApp"
        title="Fale com nossa equipe"
      >
        <WhatsAppGlyph />
        <span className="hidden text-sm font-semibold sm:inline">
          Fale conosco
        </span>
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded bg-navy px-3 py-1.5 text-xs text-ivory opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
          Fale com nossa equipe
        </span>
      </a>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`back-top fixed right-6 bottom-24 z-40 inline-flex h-11 w-11 items-center justify-center border border-gold/40 bg-navy text-gold ${
          showTop ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <span className="sr-only">{site.shortName}</span>
    </>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02Zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22Zm4.51-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z"
      />
    </svg>
  );
}
