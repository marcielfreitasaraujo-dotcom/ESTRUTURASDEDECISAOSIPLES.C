(() => {
  const CHAVE = "finup_sessao_navegador";
  const NOME = "finup_ativo";
  const autenticado = document.documentElement?.dataset?.autenticado === "1";

  if (!autenticado) {
    return;
  }

  const sessaoInvalida = () => {
    try {
      return sessionStorage.getItem(CHAVE) !== "1" || window.name !== NOME;
    } catch (_erro) {
      return true;
    }
  };

  if (sessaoInvalida()) {
    window.location.replace("/logout");
    return;
  }

  let navegando = false;

  const marcarNavegacao = () => {
    navegando = true;
  };

  document.addEventListener(
    "click",
    (ev) => {
      const alvo = ev.target.closest(
        "a[href], button[type='submit'], input[type='submit'], form button, form"
      );
      if (alvo) {
        marcarNavegacao();
      }
    },
    true
  );

  document.addEventListener("submit", marcarNavegacao, true);

  window.addEventListener("pageshow", () => {
    navegando = false;
  });

  window.addEventListener("pagehide", (ev) => {
    if (ev.persisted || navegando) {
      return;
    }
    try {
      navigator.sendBeacon("/api/sessao/fechar");
    } catch (_erro) {
      /* ignore */
    }
  });
})();
