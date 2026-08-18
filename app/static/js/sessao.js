(() => {
  const CHAVE = "fincasa_sessao_navegador";
  const autenticado = document.body?.dataset?.autenticado === "1";

  if (!autenticado) {
    return;
  }

  try {
    if (sessionStorage.getItem(CHAVE) !== "1") {
      window.location.replace("/logout");
      return;
    }
  } catch (_erro) {
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
      navigator.sendBeacon("/logout");
    } catch (_erro) {
      /* ignore */
    }
  });
})();
