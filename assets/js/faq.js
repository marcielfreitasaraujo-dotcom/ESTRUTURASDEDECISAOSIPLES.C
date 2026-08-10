export function initFaq() {
  const items = document.querySelectorAll("[data-faq-item]");
  if (!items.length) return;

  items.forEach((item) => {
    const button = item.querySelector("[data-faq-toggle]");
    if (!button) return;

    button.addEventListener("click", () => {
      const open = item.classList.contains("is-open");
      items.forEach((other) => {
        other.classList.remove("is-open");
        const btn = other.querySelector("[data-faq-toggle]");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
}
