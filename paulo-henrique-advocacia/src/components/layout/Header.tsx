"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { navItems, site, whatsappUrl } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [solid, setSolid] = useState(!isHome);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("inicio");
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
    setSolid(!isHome);
  }, [pathname, isHome]);

  useEffect(() => {
    if (!isHome) return;

    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;

    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "site-header fixed inset-x-0 top-0 z-[60] border-b border-transparent",
        solid && "is-solid",
      )}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/#inicio"
          className="flex min-w-0 items-center gap-3"
          aria-label={`${site.shortName} — início`}
        >
          <span className="header-crest">
            <Image
              src="/images/logo.webp"
              alt="Brasão PH — Paulo Henrique Advocacia"
              width={48}
              height={48}
              sizes="48px"
              className="h-11 w-11 object-contain"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-[1.05rem] leading-none text-ivory">
              Paulo Henrique
            </span>
            <span className="mt-1 block truncate text-[0.62rem] font-medium uppercase tracking-[0.16em] text-gold sm:tracking-[0.18em]">
              <span className="sm:hidden">Advocacia</span>
              <span className="hidden sm:inline">Advocacia Previdenciária</span>
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 xl:flex"
          aria-label="Seções do site"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={isHome ? `#${item.id}` : item.href}
              className="nav-link"
              aria-current={isHome && active === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center bg-gold px-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-navy transition-colors duration-300 hover:bg-gold-soft sm:inline-flex"
          >
            Fale Conosco
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center bg-gold text-navy sm:hidden"
            aria-label="Fale conosco pelo WhatsApp"
          >
            <WhatsAppGlyph />
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-ivory xl:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div
        id={menuId}
        className="mobile-drawer fixed inset-x-0 top-[var(--header-h)] z-[59] max-h-[calc(100svh-var(--header-h))] overflow-y-auto border-t border-gold/20 bg-navy-deep"
        style={{ display: open ? "block" : "none" }}
      >
        <nav className="flex flex-col px-4 py-6" aria-label="Menu móvel">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={isHome ? `#${item.id}` : item.href}
              className="border-b border-white/10 py-3.5 text-sm tracking-wide text-ivory"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-gold text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-navy"
            onClick={() => setOpen(false)}
          >
            Fale Conosco
          </a>
        </nav>
      </div>
    </header>
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
