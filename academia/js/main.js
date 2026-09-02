(() => {
  const dados = window.ACTION_FITNESS || {};
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
    toggle.addEventListener("click", () => (nav.classList.contains("open") ? fechar() : abrir()));
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fechar));
    backdrop?.addEventListener("click", fechar);
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") fechar();
    });
  }

  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const paraMinutos = (texto) => {
    const [h, m] = texto.split(":").map(Number);
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
    painelHoje.innerHTML = `<strong>${aberto ? "Aberto agora" : "Confira o horário de hoje"}</strong><span>${textoTurnos || "Consulte no WhatsApp"}</span>`;
    painelHoje.classList.toggle("aberto", aberto);
    document.querySelectorAll("[data-dia]").forEach((linha) => {
      const dias = (linha.getAttribute("data-dia") || "")
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => !Number.isNaN(item));
      linha.classList.toggle("hoje", dias.includes(dia));
    });
  }

  const faixa = document.querySelector("[data-depoimentos]");
  const anterior = document.querySelector("[data-dep-prev]");
  const proximo = document.querySelector("[data-dep-next]");
  if (faixa) {
    const ir = (dir) => faixa.scrollBy({ left: dir * (faixa.clientWidth * 0.86), behavior: "smooth" });
    anterior?.addEventListener("click", () => ir(-1));
    proximo?.addEventListener("click", () => ir(1));
  }

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxLegenda = lightbox?.querySelector("figcaption");
  const fecharLight = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("menu-aberto");
  };
  document.querySelectorAll("[data-galeria] button").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (!lightbox || !lightboxImg) return;
      const src = botao.getAttribute("data-src");
      if (!src) return;
      lightboxImg.src = src;
      lightboxImg.alt = botao.getAttribute("data-alt") || "";
      if (lightboxLegenda) lightboxLegenda.textContent = botao.getAttribute("data-alt") || "";
      lightbox.hidden = false;
    });
  });
  lightbox?.querySelector("[data-fechar-lightbox]")?.addEventListener("click", fecharLight);
  lightbox?.addEventListener("click", (evento) => {
    if (evento.target === lightbox) fecharLight();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharLight();
  });

  const marcar = (nome) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: nome });
  };
  document.querySelectorAll("[data-evento]").forEach((el) => {
    el.addEventListener("click", () => marcar(el.getAttribute("data-evento")));
  });
})();
