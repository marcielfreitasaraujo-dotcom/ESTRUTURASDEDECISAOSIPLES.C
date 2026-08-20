import { SITE, waLink, WA_MESSAGES } from "./site-config.js";

function asset(path, base) {
  return `${base}${path}`;
}

function navItems(base, current) {
  const home = base === "" ? "index.html" : "../index.html";
  const pages = base === "" ? "pages/" : "";
  return [
    { label: "Início", href: home, id: "inicio" },
    { label: "Sobre", href: `${home}#sobre`, id: "sobre" },
    { label: "Serviços", href: `${pages}servicos.html`, id: "servicos" },
    { label: "Como funciona", href: `${home}#como-funciona`, id: "como-funciona" },
    { label: "Depoimentos", href: `${home}#depoimentos`, id: "depoimentos" },
    { label: "Contato", href: `${pages}contato.html`, id: "contato" },
  ].map((item) => ({
    ...item,
    current: item.id === current,
  }));
}

export function renderHeader({ base = "", current = "inicio", solid = false } = {}) {
  const logo = asset("img/logo-realiza.png", base ? "../assets/" : "assets/");
  const items = navItems(base, current);
  const wa = waLink(WA_MESSAGES.general);
  const reviewHref = base === "" ? "pages/revisao.html" : "revisao.html";

  return `
    <div class="review-banner" role="note">
      <div class="review-banner__inner">
        <span>Prévia para revisão do cliente · faltam as fotos do Eduardo Guimarães</span>
        <a href="${reviewHref}">Ver fotos necessárias</a>
      </div>
    </div>
    <header class="site-header${solid ? " site-header--solid" : ""}" data-header>
      <div class="site-header__inner">
        <a class="brand" href="${base === "" ? "index.html" : "../index.html"}" aria-label="${SITE.name} — página inicial">
          <img class="brand__mark" src="${logo}" alt="${SITE.name}" width="56" height="56" />
          <span class="brand__text">
            <span class="brand__name">${SITE.shortName}</span>
            <span class="brand__tag">${SITE.tagline}</span>
          </span>
        </a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menu">
          <span class="nav-toggle__bars" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        </button>
        <nav class="nav" id="menu-principal" data-nav aria-label="Principal">
          <ul class="nav__list">
            ${items
              .map(
                (item) => `
              <li>
                <a class="nav__link" href="${item.href}"${item.current ? ' aria-current="page"' : ""}>${item.label}</a>
              </li>`
              )
              .join("")}
          </ul>
          <div class="nav__actions">
            <a class="btn btn--whatsapp btn--header" href="${wa}" target="_blank" rel="noopener noreferrer">
              <svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar no WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </header>
  `;
}

export function renderFooter({ base = "" } = {}) {
  const logo = asset("img/logo-realiza.png", base ? "../assets/" : "assets/");
  const home = base === "" ? "index.html" : "../index.html";
  const pages = base === "" ? "pages/" : "";
  const wa = waLink(WA_MESSAGES.general);
  const year = new Date().getFullYear();

  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a class="brand" href="${home}">
              <img class="brand__mark" src="${logo}" alt="${SITE.name}" width="56" height="56" />
              <span class="brand__text">
                <span class="brand__name">${SITE.shortName}</span>
                <span class="brand__tag">${SITE.tagline}</span>
              </span>
            </a>
            <p class="footer__about">
              Consultoria financeira e correspondente Caixa em Estreito — MA. Atendimento próximo, claro e humano.
            </p>
          </div>
          <div>
            <h2 class="footer__title">Navegação</h2>
            <ul class="footer__list">
              <li><a href="${home}">Início</a></li>
              <li><a href="${home}#sobre">Sobre</a></li>
              <li><a href="${pages}servicos.html">Serviços</a></li>
              <li><a href="${pages}contato.html">Contato</a></li>
            </ul>
          </div>
          <div>
            <h2 class="footer__title">Serviços</h2>
            <ul class="footer__list">
              <li><a href="${pages}habitacao.html">Habitação</a></li>
              <li><a href="${pages}fgts.html">FGTS</a></li>
              <li><a href="${pages}consignado.html">Consignado</a></li>
              <li><a href="${pages}servicos.html">Todos os serviços</a></li>
            </ul>
          </div>
          <div>
            <h2 class="footer__title">Contato</h2>
            <ul class="footer__list">
              <li><a href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp ${SITE.phoneDisplay}</a></li>
              <li><a href="tel:${SITE.phoneTel}">${SITE.phoneDisplay}</a></li>
              <li>${SITE.address}<br />Estreito — MA, ${SITE.cep}</li>
              <li>${SITE.hoursWeek}</li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© ${year} ${SITE.name}. Todos os direitos reservados.</p>
          <p class="footer__disclaimer">
            Consultoria / correspondente Caixa — marca e produtos da Caixa Econômica Federal. Este site não substitui os canais oficiais da Caixa.
          </p>
        </div>
      </div>
    </footer>
    <a class="whatsapp-float" href="${wa}" target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
  `;
}

export function mountShell() {
  const headerHost = document.querySelector("[data-site-header]");
  const footerHost = document.querySelector("[data-site-footer]");
  if (!headerHost && !footerHost) return;

  const base = document.body.dataset.base || "";
  const current = document.body.dataset.page || "inicio";
  const solid = document.body.dataset.header === "solid";

  if (headerHost) {
    headerHost.outerHTML = renderHeader({ base, current, solid });
  }
  if (footerHost) {
    footerHost.outerHTML = renderFooter({ base });
  }

  // Fallback do menu (garante funcionamento mesmo se o módulo nav falhar)
  const header = document.querySelector("[data-header]");
  const toggle = header?.querySelector("[data-nav-toggle]");
  if (header && toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
  }
}
