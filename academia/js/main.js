(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const backdrop = document.querySelector("[data-close-menu]");
  const header = document.querySelector(".site-header");
  const ano = document.querySelector("[data-ano]");

  if (ano) ano.textContent = String(new Date().getFullYear());

  const fechar = () => {
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menu");
    backdrop?.classList.remove("visivel");
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("menu-aberto");
  };

  const abrir = () => {
    nav?.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-label", "Fechar menu");
    backdrop?.classList.add("visivel");
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add("menu-aberto");
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      if (nav.classList.contains("open")) fechar();
      else abrir();
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fechar));
    backdrop?.addEventListener("click", fechar);
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") fechar();
    });
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const tabs = document.querySelectorAll("[data-plano-tab]");
  const paineis = document.querySelectorAll("[data-plano-painel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const alvo = tab.getAttribute("data-plano-tab");
      tabs.forEach((item) => {
        const ativo = item === tab;
        item.classList.toggle("ativo", ativo);
        item.setAttribute("aria-selected", ativo ? "true" : "false");
      });
      paineis.forEach((painel) => {
        painel.hidden = painel.getAttribute("data-plano-painel") !== alvo;
      });
    });
  });
})();
