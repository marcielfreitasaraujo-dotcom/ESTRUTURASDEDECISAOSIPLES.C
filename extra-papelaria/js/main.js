(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const backdrop = document.querySelector("[data-close-menu]");
  const fechar = () => {
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    backdrop?.classList.remove("visivel");
    if (backdrop) backdrop.hidden = true;
  };
  const abrir = () => {
    nav?.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    backdrop?.classList.add("visivel");
    if (backdrop) backdrop.hidden = false;
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      if (nav.classList.contains("open")) fechar();
      else abrir();
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fechar));
    backdrop?.addEventListener("click", fechar);
  }

  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 8 ? "0 8px 24px rgba(28,36,52,.08)" : "none";
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
