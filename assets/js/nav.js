export function initNav() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const toggle = header.querySelector("[data-nav-toggle]");
  const nav = header.querySelector("[data-nav]");

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (!toggle || !nav) return;

  const closeMenu = () => {
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  const openMenu = () => {
    header.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (header.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}
