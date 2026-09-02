(() => {
  const dados = window.ACTION_FITNESS || {};
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const backdrop = document.querySelector("[data-close-menu]");
  const header = document.querySelector(".site-header");
  const ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = String(new Date().getFullYear());
  document.body.classList.add("pronto");

  const marcar = (nome, extra) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: nome, ...(extra || {}) });
  };

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
    toggle.addEventListener("click", () => (nav.classList.contains("open") ? fechar() : abrir()));
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fechar));
    backdrop?.addEventListener("click", fechar);
  }

  const onScroll = () => {
    header?.classList.toggle("scrolled", window.scrollY > 8);
    if (!reduzirMovimento) {
      const heroImg = document.querySelector("[data-parallax]");
      if (heroImg) heroImg.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.18, 80)}px, 0) scale(1.06)`;
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const revelar = () => {
    const alvos = document.querySelectorAll(".reveal");
    if (reduzirMovimento || !("IntersectionObserver" in window)) {
      alvos.forEach((el) => el.classList.add("visivel"));
      return;
    }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          io.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    alvos.forEach((el) => io.observe(el));
  };
  revelar();

  const paraMinutos = (texto) => {
    const [h, m] = String(texto).split(":").map(Number);
    return h * 60 + m;
  };
  const agoraLocal = () => {
    const partes = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
    const semana = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6, sab: 6 };
    const chave = String(mapa.weekday || "").toLowerCase().replace(".", "");
    return {
      dia: semana[chave] ?? new Date().getDay(),
      minutos: Number(mapa.hour) * 60 + Number(mapa.minute),
    };
  };
  const painelHoje = document.querySelector("[data-hoje]");
  if (painelHoje && dados.horarios) {
    const { dia, minutos } = agoraLocal();
    const turnos = dados.horarios[dia] || [];
    const aberto = turnos.some((t) => minutos >= paraMinutos(t.abre) && minutos < paraMinutos(t.fecha));
    const textoTurnos = turnos.map((t) => `${t.abre} — ${t.fecha}`).join(" · ");
    painelHoje.innerHTML = `<p class="kicker">${aberto ? "Hoje · aberto" : "Hoje"}</p><strong>${aberto ? "Aberto agora" : "Confira o horário de hoje"}</strong><span>${textoTurnos || "Consulte no WhatsApp"}</span>`;
    painelHoje.classList.toggle("aberto", aberto);
    document.querySelectorAll("[data-dia]").forEach((linha) => {
      const dias = (linha.getAttribute("data-dia") || "")
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => !Number.isNaN(item));
      const ehHoje = dias.includes(dia);
      linha.classList.toggle("hoje", ehHoje);
      const selo = linha.querySelector("[data-selo-hoje]");
      if (selo) selo.hidden = !ehHoje;
    });
  }

  const faixa = document.querySelector("[data-depoimentos]");
  if (faixa) {
    const ir = (dir) => faixa.scrollBy({ left: dir * (faixa.clientWidth * 0.86), behavior: reduzirMovimento ? "auto" : "smooth" });
    document.querySelector("[data-dep-prev]")?.addEventListener("click", () => ir(-1));
    document.querySelector("[data-dep-next]")?.addEventListener("click", () => ir(1));
  }

  const montarMidia = (lista, seletor, tipo) => {
    const caixa = document.querySelector(seletor);
    if (!caixa || !lista?.length) return;
    lista.forEach((item, indice) => {
      const src = typeof item === "string" ? item : item.src;
      const alt = typeof item === "string" ? `Publicação ${indice + 1}` : (item.alt || "");
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "slot";
      botao.setAttribute("data-slot", String(indice));
      botao.innerHTML = `<span>${alt || "Foto"}</span>`;
      const img = new Image();
      img.alt = alt;
      img.addEventListener("load", () => {
        img.loading = "lazy";
        botao.classList.add("com-foto");
        botao.replaceChildren(img);
        botao.setAttribute("data-src", src);
        botao.setAttribute("data-alt", alt);
      });
      img.addEventListener("error", () => {});
      img.src = src;
      caixa.appendChild(botao);
    });
  };
  montarMidia(dados.galeria, "[data-galeria]", "galeria");
  montarMidia(dados.instagramFeed, "[data-instagram]", "instagram");

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxLegenda = lightbox?.querySelector("figcaption");
  const fontes = () => [...document.querySelectorAll("[data-galeria] .com-foto, [data-instagram] .com-foto")];
  let indiceAtual = 0;
  const mostrar = (indice) => {
    const itens = fontes();
    if (!itens.length || !lightbox || !lightboxImg) return;
    indiceAtual = (indice + itens.length) % itens.length;
    const botao = itens[indiceAtual];
    lightboxImg.src = botao.getAttribute("data-src");
    lightboxImg.alt = botao.getAttribute("data-alt") || "";
    lightboxImg.hidden = false;
    if (lightboxLegenda) lightboxLegenda.textContent = botao.getAttribute("data-alt") || "";
    lightbox.hidden = false;
    document.body.classList.add("menu-aberto");
    marcar("gallery_open");
  };
  const fecharLight = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("menu-aberto");
  };
  document.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-galeria] .com-foto, [data-instagram] .com-foto");
    if (!botao) return;
    mostrar(fontes().indexOf(botao));
  });
  lightbox?.querySelector("[data-fechar-lightbox]")?.addEventListener("click", fecharLight);
  lightbox?.querySelector("[data-prev]")?.addEventListener("click", () => mostrar(indiceAtual - 1));
  lightbox?.querySelector("[data-next]")?.addEventListener("click", () => mostrar(indiceAtual + 1));
  lightbox?.addEventListener("click", (evento) => {
    if (evento.target === lightbox) fecharLight();
  });
  let toqueX = 0;
  lightbox?.addEventListener("touchstart", (evento) => {
    toqueX = evento.changedTouches[0].clientX;
  }, { passive: true });
  lightbox?.addEventListener("touchend", (evento) => {
    const delta = evento.changedTouches[0].clientX - toqueX;
    if (Math.abs(delta) < 40) return;
    mostrar(indiceAtual + (delta < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      fechar();
      fecharLight();
    }
    if (lightbox && !lightbox.hidden) {
      if (evento.key === "ArrowRight") mostrar(indiceAtual + 1);
      if (evento.key === "ArrowLeft") mostrar(indiceAtual - 1);
    }
  });

  const planos = document.querySelector("#planos");
  if (planos && "IntersectionObserver" in window) {
    const ioPlanos = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        marcar("view_plans");
        ioPlanos.disconnect();
      }
    }, { threshold: 0.4 });
    ioPlanos.observe(planos);
  }

  document.querySelectorAll("[data-evento]").forEach((el) => {
    el.addEventListener("click", () => marcar(el.getAttribute("data-evento")));
  });
})();
