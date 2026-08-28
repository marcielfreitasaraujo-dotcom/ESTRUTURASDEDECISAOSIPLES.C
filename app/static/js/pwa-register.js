(() => {
  if (!("serviceWorker" in navigator)) return;
  const registrar = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              // Nova versão pronta; próximo reload usa o SW novo (skipWaiting no install).
            }
          });
        });
      })
      .catch(() => {
        /* ignore: PWA opcional */
      });
  };
  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar);
})();
