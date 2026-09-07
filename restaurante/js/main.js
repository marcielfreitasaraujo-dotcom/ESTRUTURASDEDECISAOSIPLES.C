(() => {
  const dados = window.CASA_DO_RIO || {};
  const waNumero = String(dados.telefoneE164 || "5599999990000");
  const waBase = `https://wa.me/${waNumero}`;
  const instagram = dados.instagram || "casadorio.estreito";
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const brl = (n) =>
    Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const waLink = (texto) =>
    `${waBase}?text=${encodeURIComponent(texto || dados.whatsappTexto || "Olá!")}`;

  document.querySelectorAll("[data-whatsapp]").forEach((el) => {
    const texto = el.getAttribute("data-whatsapp-texto") || dados.whatsappTexto;
    el.setAttribute("href", waLink(texto));
  });
  document.querySelectorAll("[data-instagram]").forEach((el) => {
    el.setAttribute("href", `https://www.instagram.com/${instagram}/`);
  });
  document.querySelectorAll("[data-tel-link]").forEach((el) => {
    el.setAttribute("href", `tel:+${waNumero}`);
    if (dados.telefone) el.textContent = dados.telefone;
  });
  const mapaQuery = dados.mapaQuery || "Estreito, Maranhão";
  const mapa = document.querySelector("[data-mapa]");
  if (mapa) {
    mapa.src = `https://maps.google.com/maps?q=${encodeURIComponent(mapaQuery)}&output=embed`;
  }
  const maps = document.querySelector("[data-maps]");
  if (maps) {
    maps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapaQuery)}`;
  }
  const ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const backdrop = document.querySelector("[data-close-menu]");
  const fecharMenu = () => {
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menu");
    backdrop?.classList.remove("visivel");
    if (backdrop) backdrop.hidden = true;
  };
  const abrirMenu = () => {
    nav?.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-label", "Fechar menu");
    backdrop?.classList.add("visivel");
    if (backdrop) backdrop.hidden = false;
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      if (nav.classList.contains("open")) fecharMenu();
      else abrirMenu();
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fecharMenu));
    backdrop?.addEventListener("click", fecharMenu);
  }

  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const agoraAberto = () => {
    const agora = new Date();
    const faixas = (dados.horarios && dados.horarios[agora.getDay()]) || [];
    const minutos = agora.getHours() * 60 + agora.getMinutes();
    return faixas.some((f) => {
      const [ah, am] = f.abre.split(":").map(Number);
      const [fh, fm] = f.fecha.split(":").map(Number);
      return minutos >= ah * 60 + am && minutos < fh * 60 + fm;
    });
  };
  const pill = document.querySelector("[data-status-horario]");
  const pillTxt = document.querySelector("[data-status-texto]");
  if (pill && pillTxt) {
    const aberto = agoraAberto();
    pill.dataset.aberto = aberto ? "sim" : "nao";
    pillTxt.textContent = aberto ? "Aberto agora" : "Fechado agora · veja os horários";
  }

  const listaHoras = document.getElementById("lista-horarios");
  if (listaHoras && dados.horarios) {
    const hoje = new Date().getDay();
    listaHoras.innerHTML = dias
      .map((nome, i) => {
        const faixas = dados.horarios[i] || [];
        const texto = faixas.length
          ? faixas.map((f) => `${f.abre}–${f.fecha}`).join(" · ")
          : "Fechado";
        return `<li class="${i === hoje ? "hoje" : ""}"><span>${nome}</span><span>${texto}</span></li>`;
      })
      .join("");
  }

  const pedido = [];
  const tabs = document.getElementById("cardapio-tabs");
  const paineis = document.getElementById("cardapio-paineis");
  const categorias = dados.cardapio || [];

  const mostrarCategoria = (id) => {
    tabs?.querySelectorAll(".tab").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.id === id ? "true" : "false");
    });
    paineis?.querySelectorAll(".cardapio-panel").forEach((painel) => {
      painel.classList.toggle("ativo", painel.id === `painel-${id}`);
    });
  };

  if (tabs && paineis) {
    tabs.innerHTML = categorias
      .map(
        (cat, i) =>
          `<button class="tab" type="button" role="tab" data-id="${cat.id}" aria-selected="${i === 0}">${cat.nome}</button>`
      )
      .join("");
    paineis.innerHTML = categorias
      .map(
        (cat, i) => `
        <div class="cardapio-panel ${i === 0 ? "ativo" : ""}" id="painel-${cat.id}">
          <div class="menu-layout">
            <div class="menu-photo">
              <picture>
                <source type="image/webp" srcset="${cat.fotoWebp}">
                <img src="${cat.foto}" width="1400" height="933" alt="${cat.nome} da Casa do Rio">
              </picture>
            </div>
            <div class="menu-list">
              ${cat.itens
                .map(
                  (item) => `
                <article class="prato">
                  <div>
                    <h3>${item.nome}</h3>
                    <p>${item.desc}</p>
                  </div>
                  <div class="prato-side">
                    <span class="preco">${brl(item.preco)}</span>
                    <button class="btn btn-add" type="button" data-add="${encodeURIComponent(item.nome)}" data-preco="${item.preco}">Adicionar</button>
                  </div>
                </article>`
                )
                .join("")}
            </div>
          </div>
        </div>`
      )
      .join("");
    tabs.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".tab");
      if (btn) mostrarCategoria(btn.dataset.id);
    });
    paineis.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-add]");
      if (!btn) return;
      pedido.push({
        nome: decodeURIComponent(btn.getAttribute("data-add")),
        preco: Number(btn.getAttribute("data-preco")),
      });
      renderPedido();
    });
  }

  const barra = document.getElementById("pedido-bar");
  const drawer = document.getElementById("pedido-drawer");
  const caixaItens = document.getElementById("pedido-itens");

  const totalPedido = () => pedido.reduce((s, i) => s + i.preco, 0);

  const renderPedido = () => {
    const qtd = pedido.length;
    document.querySelectorAll("[data-pedido-qtd]").forEach((el) => {
      el.textContent = qtd === 1 ? "1 item" : `${qtd} itens`;
    });
    document.querySelectorAll("[data-pedido-total]").forEach((el) => {
      el.textContent = brl(totalPedido());
    });
    if (barra) {
      barra.hidden = qtd === 0;
      barra.classList.toggle("visivel", qtd > 0);
    }
    if (caixaItens) {
      if (!qtd) {
        caixaItens.innerHTML = '<p class="pedido-vazio">Nenhum prato ainda. Escolha no cardápio.</p>';
      } else {
        caixaItens.innerHTML = pedido
          .map(
            (item, i) => `
          <div class="pedido-item">
            <span>${item.nome}<br><small>${brl(item.preco)}</small></span>
            <button class="btn btn-ghost" type="button" data-remover="${i}">Remover</button>
          </div>`
          )
          .join("");
      }
    }
  };

  const abrirPedido = () => {
    if (!drawer) return;
    drawer.hidden = false;
    drawer.classList.add("aberto");
  };
  const fecharPedido = () => {
    if (!drawer) return;
    drawer.classList.remove("aberto");
    drawer.hidden = true;
  };

  document.querySelector("[data-abrir-pedido]")?.addEventListener("click", abrirPedido);
  document.querySelectorAll("[data-fechar-pedido]").forEach((el) => {
    el.addEventListener("click", fecharPedido);
  });
  caixaItens?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-remover]");
    if (!btn) return;
    pedido.splice(Number(btn.getAttribute("data-remover")), 1);
    renderPedido();
  });
  document.querySelector("[data-enviar-pedido]")?.addEventListener("click", () => {
    if (!pedido.length) return;
    const linhas = pedido.map((i) => `• ${i.nome} — ${brl(i.preco)}`).join("\n");
    const texto = `Olá! Quero fazer um pedido na Casa do Rio:\n${linhas}\n\nTotal: ${brl(totalPedido())}`;
    window.open(waLink(texto), "_blank", "noopener,noreferrer");
  });

  const form = document.getElementById("form-reserva");
  if (form) {
    const campoData = form.querySelector('[name="data"]');
    if (campoData) {
      const hoje = new Date();
      const iso = hoje.toISOString().slice(0, 10);
      campoData.min = iso;
      campoData.value = iso;
    }
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const dataBr = String(fd.get("data") || "")
        .split("-")
        .reverse()
        .join("/");
      const obs = String(fd.get("obs") || "").trim();
      const tel = String(fd.get("telefone") || "").trim();
      let texto = `Olá! Quero reservar mesa na Casa do Rio.\nNome: ${fd.get("nome")}\nData: ${dataBr}\nHorário: ${fd.get("horario")}\nPessoas: ${fd.get("pessoas")}`;
      if (tel) texto += `\nTelefone: ${tel}`;
      if (obs) texto += `\nObs.: ${obs}`;
      window.open(waLink(texto), "_blank", "noopener,noreferrer");
    });
  }

  renderPedido();
})();
