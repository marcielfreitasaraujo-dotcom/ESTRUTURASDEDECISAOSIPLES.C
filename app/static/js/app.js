(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const sidebar = $("#sidebar");
  const backdrop = $(".sidebar-backdrop");
  const CHAVE_SIDEBAR = "finup_sidebar_recolhida";

  function aplicarSidebarRecolhida(recolhida) {
    document.documentElement.classList.toggle("sidebar-recolhida", recolhida);
    $$("[data-collapse-sidebar]").forEach((btn) => {
      btn.textContent = recolhida ? "»" : "«";
      btn.setAttribute("aria-label", recolhida ? "Expandir menu" : "Recolher menu");
      btn.title = recolhida ? "Expandir menu" : "Recolher menu";
      btn.setAttribute("aria-pressed", recolhida ? "true" : "false");
    });
    window.finupAgendarRedimensionarGraficos?.();
  }

  try {
    aplicarSidebarRecolhida(localStorage.getItem(CHAVE_SIDEBAR) === "1");
  } catch (_erro) {
    aplicarSidebarRecolhida(false);
  }

  $$("[data-collapse-sidebar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recolhida = !document.documentElement.classList.contains("sidebar-recolhida");
      aplicarSidebarRecolhida(recolhida);
      try {
        localStorage.setItem(CHAVE_SIDEBAR, recolhida ? "1" : "0");
      } catch (_erro) {
        /* ignore */
      }
    });
  });

  $$("[data-toggle-sidebar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.matchMedia("(min-width: 861px)").matches) {
        const recolhida = !document.documentElement.classList.contains("sidebar-recolhida");
        aplicarSidebarRecolhida(recolhida);
        try {
          localStorage.setItem(CHAVE_SIDEBAR, recolhida ? "1" : "0");
        } catch (_erro) {
          /* ignore */
        }
        return;
      }
      sidebar?.classList.toggle("aberto");
      backdrop?.classList.toggle("visivel");
    });
  });

  const modal = $("#modal-lancamento");
  const tipoInput = $("#campo-tipo");
  const wrapDestino = $("#wrap-destino");
  const wrapDestinatario = $("#wrap-destinatario");
  const wrapCategoria = $("#wrap-categoria");
  const wrapTransferenciaModo = $("#wrap-transferencia-modo");
  const wrapFormaPagamento = $("#wrap-forma-pagamento");
  const labelContaOrigem = $("#label-conta-origem");
  const campoDestino = $("#campo-destino");
  const campoDestinatario = $("#campo-destinatario");
  const campoTransferenciaModo = $("#campo-transferencia-modo");
  const campoContaOrigem = $("#campo-conta-origem");

  function filtrarContasDestino() {
    if (!campoDestino || !campoContaOrigem) return;
    const origemId = campoContaOrigem.value;
    $$("#campo-destino option").forEach((opt) => {
      if (!opt.value) return;
      opt.hidden = opt.value === origemId;
      if (opt.hidden && opt.selected) opt.selected = false;
    });
  }

  function definirModoTransferencia(modo) {
    if (campoTransferenciaModo) campoTransferenciaModo.value = modo;
    $$("[data-transferencia-modo]").forEach((el) => {
      el.classList.toggle("ativo", el.dataset.transferenciaModo === modo);
    });
    const interna = modo === "minhas_contas";
    if (wrapDestino) wrapDestino.hidden = !interna;
    if (wrapDestinatario) wrapDestinatario.hidden = interna;
    if (campoDestino) campoDestino.required = interna;
    if (campoDestinatario) campoDestinatario.required = !interna;
    if (interna) filtrarContasDestino();
  }

  function definirTipo(tipo) {
    if (tipoInput) tipoInput.value = tipo;
    $$(".chip-tipo[data-set-tipo]").forEach((el) => {
      el.classList.toggle("ativo", el.dataset.setTipo === tipo);
    });
    const ehTransferencia = tipo === "transferencia";
    if (wrapDestino) wrapDestino.hidden = !ehTransferencia;
    if (wrapTransferenciaModo) wrapTransferenciaModo.hidden = !ehTransferencia;
    if (wrapCategoria) wrapCategoria.hidden = ehTransferencia;
    if (wrapFormaPagamento) wrapFormaPagamento.hidden = ehTransferencia;
    if (labelContaOrigem) {
      labelContaOrigem.textContent = ehTransferencia ? "Conta origem (debitar)" : "Conta";
    }
    if (ehTransferencia) {
      definirModoTransferencia(campoTransferenciaModo?.value || "minhas_contas");
    } else {
      if (wrapDestinatario) wrapDestinatario.hidden = true;
      if (campoDestino) campoDestino.required = false;
      if (campoDestinatario) campoDestinatario.required = false;
    }
    $$("#campo-categoria option").forEach((opt) => {
      if (!opt.value) return;
      const t = opt.dataset.tipo;
      if (tipo === "receita") opt.hidden = t !== "receita";
      else if (tipo === "despesa") opt.hidden = t === "receita";
      else opt.hidden = false;
    });
  }

  function abrirLancamento(tipo = "despesa") {
    if (!modal) return;
    modal.hidden = false;
    definirTipo(tipo);
    const valor = modal.querySelector("[name=valor]");
    valor?.focus();
  }

  function fecharLancamento() {
    if (modal) modal.hidden = true;
  }

  $$("[data-open-lancamento]").forEach((btn) => {
    btn.addEventListener("click", () => abrirLancamento(btn.dataset.tipo || "despesa"));
  });
  $$("[data-close-modal]").forEach((btn) => btn.addEventListener("click", fecharLancamento));
  $$("[data-set-tipo]").forEach((btn) => {
    btn.addEventListener("click", () => definirTipo(btn.dataset.setTipo));
  });
  $$("[data-transferencia-modo]").forEach((btn) => {
    btn.addEventListener("click", () => definirModoTransferencia(btn.dataset.transferenciaModo));
  });
  campoContaOrigem?.addEventListener("change", filtrarContasDestino);
  modal?.addEventListener("click", (ev) => {
    if (ev.target === modal) fecharLancamento();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") fecharLancamento();
  });

  $$(".input-valor, input[name=valor], input[name=saldo_inicial], input[name=saldo_informado]").forEach((input) => {
    input.addEventListener("input", () => {
      let v = input.value.replace(/[^\d]/g, "");
      if (!v) {
        input.value = "";
        return;
      }
      const n = (parseInt(v, 10) / 100).toFixed(2);
      input.value = n.replace(".", ",");
    });
  });

  const busca = $("#busca-global");
  const results = $("#search-results");
  let t = null;
  busca?.addEventListener("input", () => {
    clearTimeout(t);
    const q = busca.value.trim();
    if (q.length < 2) {
      if (results) results.hidden = true;
      return;
    }
    t = setTimeout(async () => {
      const res = await fetch(`/api/pesquisa?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!results) return;
      if (!data.itens.length) {
        results.innerHTML = "<div class='empty' style='padding:0.8rem'>Nada encontrado</div>";
        results.hidden = false;
        return;
      }
      results.innerHTML = data.itens
        .map(
          (item) =>
            `<a href="${item.url}"><span>${item.descricao} · ${item.data}</span><strong>${item.valor}</strong></a>`
        )
        .join("");
      results.hidden = false;
    }, 220);
  });
  document.addEventListener("click", (ev) => {
    if (results && !results.contains(ev.target) && ev.target !== busca) results.hidden = true;
  });

  const notifyBtn = document.querySelector("[data-toggle-notify]");
  const notifyPanel = document.getElementById("notify-panel");
  notifyBtn?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (notifyPanel) notifyPanel.hidden = !notifyPanel.hidden;
  });
  document.addEventListener("click", (ev) => {
    if (notifyPanel && !notifyPanel.contains(ev.target) && ev.target !== notifyBtn) {
      notifyPanel.hidden = true;
    }
  });

  document.querySelectorAll("[data-toggle-senha]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const campo = document.getElementById(btn.dataset.alvo);
      if (!campo) return;
      const mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      btn.textContent = mostrar ? "Ocultar" : "Mostrar";
      btn.setAttribute("aria-pressed", mostrar ? "true" : "false");
      btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    });
  });

  $$("[data-voltar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ref = document.referrer || "";
      const mesmaOrigem = ref.startsWith(location.origin);
      if (mesmaOrigem && window.history.length > 1) {
        history.back();
        return;
      }
      location.href = btn.dataset.voltarFallback || "/";
    });
  });

  const mainWrap = $(".main-wrap");
  if (mainWrap && window.ResizeObserver && window.finupAgendarRedimensionarGraficos) {
    let tamanhoTimer = null;
    const observer = new ResizeObserver(() => {
      clearTimeout(tamanhoTimer);
      tamanhoTimer = setTimeout(() => window.finupAgendarRedimensionarGraficos(), 80);
    });
    observer.observe(mainWrap);
  }
})();
