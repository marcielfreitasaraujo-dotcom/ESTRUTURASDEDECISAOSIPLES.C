(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const sidebar = $("#sidebar");
  const backdrop = $(".sidebar-backdrop");
  $$("[data-toggle-sidebar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sidebar?.classList.toggle("aberto");
      backdrop?.classList.toggle("visivel");
    });
  });

  const modal = $("#modal-lancamento");
  const tipoInput = $("#campo-tipo");
  const wrapDestino = $("#wrap-destino");
  const wrapCategoria = $("#wrap-categoria");

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

  function definirTipo(tipo) {
    if (tipoInput) tipoInput.value = tipo;
    $$(".chip-tipo").forEach((el) => {
      el.classList.toggle("ativo", el.dataset.setTipo === tipo);
    });
    if (wrapDestino) wrapDestino.hidden = tipo !== "transferencia";
    if (wrapCategoria) wrapCategoria.hidden = tipo === "transferencia";
    $$("#campo-categoria option").forEach((opt) => {
      if (!opt.value) return;
      const t = opt.dataset.tipo;
      if (tipo === "receita") opt.hidden = t !== "receita";
      else if (tipo === "despesa") opt.hidden = t === "receita";
      else opt.hidden = false;
    });
  }

  $$("[data-open-lancamento]").forEach((btn) => {
    btn.addEventListener("click", () => abrirLancamento(btn.dataset.tipo || "despesa"));
  });
  $$("[data-close-modal]").forEach((btn) => btn.addEventListener("click", fecharLancamento));
  $$("[data-set-tipo]").forEach((btn) => {
    btn.addEventListener("click", () => definirTipo(btn.dataset.setTipo));
  });
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
})();
