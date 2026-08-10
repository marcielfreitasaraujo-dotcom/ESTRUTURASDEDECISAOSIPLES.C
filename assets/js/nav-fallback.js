/**
 * Fallback não-módulo para menu mobile.
 * Carregado após o module bundle.
 */
(function () {
  function bind() {
    var header = document.querySelector("[data-header]");
    var toggle = header && header.querySelector("[data-nav-toggle]");
    var nav = header && header.querySelector("[data-nav]");
    if (!header || !toggle || toggle.getAttribute("data-bound") === "1") return;

    toggle.setAttribute("data-bound", "1");
    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });

    if (nav) {
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          header.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(bind, 0);
    });
  } else {
    setTimeout(bind, 0);
  }
  window.addEventListener("load", bind);
})();
