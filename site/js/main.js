(function () {
  const cabecalho = document.querySelector(".site-header");
  const botao = document.querySelector("[data-menu-toggle]");
  const menu = document.getElementById("menu");
  const ano = document.querySelector("[data-ano]");
  const metaSistema = document.querySelector('meta[name="finup-sistema"]');
  const baseSistema = (metaSistema && metaSistema.getAttribute("content")
    ? metaSistema.getAttribute("content")
    : "https://finup.araujooficial.com.br"
  ).replace(/\/$/, "");
  const urlSistema = baseSistema + "/login";
  const urlCadastro = baseSistema + "/cadastro";

  document.querySelectorAll("[data-sistema]").forEach((link) => {
    link.setAttribute("href", urlSistema);
  });
  document.querySelectorAll("[data-cadastro]").forEach((link) => {
    link.setAttribute("href", urlCadastro);
  });
  // Botão de assinar: link do checkout da Kiwify (meta kiwify-checkout).
  // Fica direto no HTML; aqui só garante o link caso a meta seja trocada.
  const metaCheckout = document.querySelector('meta[name="kiwify-checkout"]');
  const urlCheckout = (metaCheckout && metaCheckout.getAttribute("content") || "").trim();
  document.querySelectorAll("[data-checkout]").forEach((link) => {
    if (urlCheckout) {
      link.setAttribute("href", urlCheckout);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.hidden = false;
    } else if (!link.getAttribute("href") || link.getAttribute("href").startsWith("#")) {
      link.hidden = true;
    }
  });

  if (ano) {
    ano.textContent = String(new Date().getFullYear());
  }

  const marcarRolagem = () => {
    if (!cabecalho) return;
    cabecalho.classList.toggle("scrolled", window.scrollY > 8);
  };
  marcarRolagem();
  window.addEventListener("scroll", marcarRolagem, { passive: true });

  // Menu do celular
  if (botao && menu) {
    const fecharMenu = () => {
      menu.classList.remove("aberto");
      document.body.classList.remove("menu-aberto");
      botao.setAttribute("aria-expanded", "false");
      botao.setAttribute("aria-label", "Abrir menu");
    };
    botao.addEventListener("click", () => {
      const aberto = menu.classList.toggle("aberto");
      document.body.classList.toggle("menu-aberto", aberto);
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
      botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", fecharMenu);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && menu.classList.contains("aberto")) {
        fecharMenu();
        botao.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (mq) => {
      if (mq.matches) fecharMenu();
    });
  }

  // Vitrine de telas (abas acessíveis: clique e setas do teclado)
  const vitrine = document.querySelector("[data-vitrine]");
  if (vitrine) {
    const abas = Array.from(vitrine.querySelectorAll('[role="tab"]'));
    const img = vitrine.querySelector("[data-vitrine-img]");
    const selecionar = (aba, focar) => {
      abas.forEach((a) => {
        const ativa = a === aba;
        a.setAttribute("aria-selected", ativa ? "true" : "false");
        a.tabIndex = ativa ? 0 : -1;
      });
      if (img) {
        img.src = "img/telas/" + aba.dataset.tela + ".webp";
        img.alt = aba.dataset.alt || "";
        img.width = Number(aba.dataset.largura) || 1600;
        img.height = Number(aba.dataset.altura) || 1000;
      }
      if (focar) aba.focus();
    };
    abas.forEach((aba, i) => {
      aba.addEventListener("click", () => selecionar(aba, false));
      aba.addEventListener("keydown", (ev) => {
        let alvo = null;
        if (ev.key === "ArrowRight") alvo = abas[(i + 1) % abas.length];
        else if (ev.key === "ArrowLeft") alvo = abas[(i - 1 + abas.length) % abas.length];
        else if (ev.key === "Home") alvo = abas[0];
        else if (ev.key === "End") alvo = abas[abas.length - 1];
        if (alvo) {
          ev.preventDefault();
          selecionar(alvo, true);
        }
      });
    });
  }
})();
