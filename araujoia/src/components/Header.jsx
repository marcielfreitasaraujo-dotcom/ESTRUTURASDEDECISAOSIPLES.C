import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { brand, nav } from "../data/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 pad-x flex items-center justify-between py-4 transition-colors duration-300 ${
        scrolled ? "border-b border-white/10 bg-bg/90 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <a href="#topo" className="font-display text-lg font-extrabold tracking-tight text-accent">
        {brand.name}
      </a>

      <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
        {nav.slice(1).map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`text-[0.95rem] font-medium transition-colors ${
              item.href === "#contato"
                ? "rounded-[2px] bg-accent px-3.5 py-2 text-bg hover:bg-hover"
                : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <button
        type="button"
        className="relative z-[60] flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`h-0.5 w-5 bg-ink transition ${open ? "translate-y-1 rotate-45" : ""}`} />
        <span className={`h-0.5 w-5 bg-ink transition ${open ? "-translate-y-1 -rotate-45" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg md:hidden"
            aria-label="Mobile"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display text-3xl font-bold text-ink"
              >
                {item.label}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
