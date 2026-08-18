(() => {
  const CHAVE = "fincasa_sessao_navegador";
  const autenticado = document.body?.dataset?.autenticado === "1";
  if (!autenticado) {
    return;
  }
  try {
    if (sessionStorage.getItem(CHAVE) === "1") {
      return;
    }
  } catch (_erro) {
    window.location.replace("/logout");
    return;
  }
  window.location.replace("/logout");
})();
