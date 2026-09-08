(function () {
  const cfg = window.MOVIFIT_CONFIG || {};
  const whatsapp = String(cfg.whatsapp || "").replace(/\D/g, "");
  const instagram = String(cfg.instagram || "").trim();
  const mapsQuery = cfg.mapsQuery || "Av. Chico Brito, 94, Loteamento São Bernardo, Estreito - MA, 65975-000";
  const mensagem = cfg.mensagemWhatsApp || "Olá! Gostaria de conhecer a Movifit Academia e saber mais sobre os planos.";

  const waUrl = whatsapp
    ? "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(mensagem)
    : "";

  const mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapsQuery);

  document.querySelectorAll("[data-maps-dir]").forEach((link) => {
    link.setAttribute("href", mapsUrl);
  });

  const applyWhatsapp = () => {
    document.querySelectorAll("[data-whatsapp]").forEach((el) => {
      if (waUrl) {
        el.hidden = false;
        el.setAttribute("href", waUrl);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else if (el.classList.contains("wa-float") || el.classList.contains("btn")) {
        el.setAttribute("href", "#contato");
        el.removeAttribute("target");
      } else {
        el.hidden = true;
      }
    });
    document.querySelectorAll("[data-whatsapp-soon]").forEach((el) => {
      el.hidden = Boolean(waUrl);
    });
  };

  const applyInstagram = () => {
    document.querySelectorAll("[data-instagram]").forEach((el) => {
      if (instagram) {
        el.hidden = false;
        el.setAttribute("href", instagram);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.hidden = true;
      }
    });
    document.querySelectorAll("[data-instagram-soon]").forEach((el) => {
      el.hidden = Boolean(instagram);
    });
  };

  applyWhatsapp();
  applyInstagram();

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");
  const backdrop = document.querySelector("[data-close-menu]");

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", open);
    if (backdrop) backdrop.hidden = !open;
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
  }
  if (backdrop) backdrop.addEventListener("click", () => setMenu(false));
  if (menu) {
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  const parallax = document.querySelector("[data-parallax]");
  const moveParallax = () => {
    if (!parallax || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const y = Math.min(window.scrollY, 700);
    parallax.style.transform = "scale(1.08) translate3d(0," + (y * 0.12) + "px,0)";
  };
  moveParallax();
  window.addEventListener("scroll", moveParallax, { passive: true });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  const lightboxCap = lightbox ? lightbox.querySelector("figcaption") : null;
  const items = Array.from(document.querySelectorAll("[data-lightbox]"));
  let current = 0;
  let lastFocus = null;

  const openLightbox = (index) => {
    if (!lightbox || !items.length) return;
    current = (index + items.length) % items.length;
    const item = items[current];
    lastFocus = document.activeElement;
    lightboxImg.src = item.getAttribute("href");
    lightboxImg.alt = item.querySelector("img") ? item.querySelector("img").alt : "";
    lightboxCap.textContent = item.getAttribute("data-caption") || "";
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightbox.querySelector(".lightbox-close").focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lightboxImg.src = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  items.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(index);
    });
  });

  if (lightbox) {
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", () => openLightbox(current - 1));
    lightbox.querySelector(".lightbox-next").addEventListener("click", () => openLightbox(current + 1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
      closeLightbox();
    }
    if (lightbox && !lightbox.hidden) {
      if (event.key === "ArrowLeft") openLightbox(current - 1);
      if (event.key === "ArrowRight") openLightbox(current + 1);
    }
  });

  const form = document.getElementById("formulario");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const nome = (form.nome.value || "").trim();
      const fone = (form.whatsapp.value || "").trim();
      const texto = (form.mensagem.value || "").trim() || mensagem;
      const status = form.querySelector(".form-status");

      if (!nome || !fone) {
        status.textContent = "Preencha nome e WhatsApp para continuar.";
        return;
      }

      const corpo = "Olá! Meu nome é " + nome + ". WhatsApp: " + fone + ". " + texto;

      if (waUrl) {
        const url = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(corpo);
        window.open(url, "_blank", "noopener,noreferrer");
        status.textContent = "Abrindo o WhatsApp da Movifit...";
        form.reset();
        return;
      }

      status.textContent =
        "O WhatsApp oficial ainda será publicado. Enquanto isso, visite a academia na Av. Chico Brito, 94 — Estreito-MA.";
    });
  }
})();
