import { brand, links, nav } from "../data/site";

export default function Footer() {
  return (
    <footer className="pad-x border-t border-white/10 py-12">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-extrabold text-accent">{brand.name}</p>
          <p className="mt-2 text-muted">{brand.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Rodapé">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <ul className="space-y-2 text-sm">
          <li>
            <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent">
              Instagram {links.instagramHandle}
            </a>
          </li>
          <li>
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent">
              WhatsApp
            </a>
          </li>
        </ul>
      </div>
      <p className="mt-10 text-sm text-muted">© 2026 {brand.name}. Todos os direitos reservados.</p>
    </footer>
  );
}
