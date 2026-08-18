(() => {
  const CHAVE = "fincasa_sessao_navegador";
  const autenticado = document.body?.dataset?.autenticado === "1";
  const canal =
    typeof BroadcastChannel === "function" ? new BroadcastChannel("fincasa_sessao") : null;

  function marcarSessaoViva() {
    try {
      sessionStorage.setItem(CHAVE, "1");
    } catch (_erro) {
      /* storage bloqueado */
    }
  }

  function sessaoViva() {
    try {
      return sessionStorage.getItem(CHAVE) === "1";
    } catch (_erro) {
      return false;
    }
  }

  if (canal) {
    canal.addEventListener("message", (ev) => {
      if (ev.data === "ping" && sessaoViva()) {
        canal.postMessage("pong");
      }
      if (ev.data === "pong") {
        marcarSessaoViva();
      }
    });
  }

  window.addEventListener("storage", (ev) => {
    if (ev.key === "fincasa_sessao_ping" && sessaoViva()) {
      try {
        localStorage.setItem("fincasa_sessao_pong", String(Date.now()));
      } catch (_erro) {
        /* ignore */
      }
    }
    if (ev.key === "fincasa_sessao_pong" && ev.newValue) {
      marcarSessaoViva();
    }
  });

  document.querySelector("form[data-login-sessao]")?.addEventListener("submit", marcarSessaoViva);

  if (!autenticado) {
    return;
  }

  if (sessaoViva()) {
    return;
  }

  canal?.postMessage("ping");
  try {
    localStorage.setItem("fincasa_sessao_ping", String(Date.now()));
  } catch (_erro) {
    /* ignore */
  }

  window.setTimeout(() => {
    if (sessaoViva()) {
      return;
    }
    window.location.replace("/logout");
  }, 200);
})();
