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
  const metaHotmart = document.querySelector('meta[name="hotmart-checkout"]');
  const urlHotmartMeta = (metaHotmart && metaHotmart.getAttribute("content") || "").trim();

  const aplicarHotmart = (url) => {
    const checkout = (url || "").trim();
    document.querySelectorAll("[data-hotmart]").forEach((link) => {
      if (checkout) {
        link.setAttribute("href", checkout);
        link.hidden = false;
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      } else {
        link.hidden = true;
      }
    });
  };
  aplicarHotmart(urlHotmartMeta);
  if (!urlHotmartMeta) {
    fetch(baseSistema + "/api/checkout-hotmart")
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((dados) => {
        if (dados && dados.url) aplicarHotmart(dados.url);
      })
      .catch(() => {});
  }

  if (ano) {
    ano.textContent = String(new Date().getFullYear());
  }

  const marcarRolagem = () => {
    if (!cabecalho) return;
    cabecalho.classList.toggle("scrolled", window.scrollY > 8);
  };
  marcarRolagem();
  window.addEventListener("scroll", marcarRolagem, { passive: true });

  if (botao && menu) {
    botao.addEventListener("click", () => {
      const aberto = menu.classList.toggle("aberto");
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
      botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("aberto");
        botao.setAttribute("aria-expanded", "false");
        botao.setAttribute("aria-label", "Abrir menu");
      });
    });
  }
})();
