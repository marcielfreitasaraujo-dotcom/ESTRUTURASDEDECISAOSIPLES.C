(() => {
  const dados = window.CASA_DO_RIO || {};
  const waNumero = String(dados.telefoneE164 || "5599999990000");
  const waBase = `https://wa.me/${waNumero}`;
  const instagram = dados.instagram || "casadorio.estreito";
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const corpo = document.body;

  const brl = (n) =>
    Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const waLink = (texto) =>
    `${waBase}?text=${encodeURIComponent(texto || dados.whatsappTexto || "Olá!")}`;

  const trava = (on) => corpo.classList.toggle("trava", on);

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
    trava(false);
  };
  const abrirMenu = () => {
    nav?.classList.add("open");
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-label", "Fechar menu");
    backdrop?.classList.add("visivel");
    if (backdrop) backdrop.hidden = false;
    trava(true);
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      if (nav.classList.contains("open")) fecharMenu();
      else abrirMenu();
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", fecharMenu));
    backdrop?.addEventListener("click", fecharMenu);
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980 && nav.classList.contains("open")) fecharMenu();
    });
  }

  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const secoes = [...document.querySelectorAll("main section[id]")];
  const linksNav = [...document.querySelectorAll("[data-nav]")];
  const marcarNav = () => {
    const y = window.scrollY + 120;
    let atual = secoes[0]?.id;
    secoes.forEach((sec) => {
      if (sec.offsetTop <= y) atual = sec.id;
    });
    linksNav.forEach((link) => {
      const ativo = link.getAttribute("href") === `#${atual}`;
      if (ativo) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };
  window.addEventListener("scroll", marcarNav, { passive: true });
  marcarNav();

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
      const sel = btn.dataset.id === id;
      btn.setAttribute("aria-selected", sel ? "true" : "false");
      btn.tabIndex = sel ? 0 : -1;
    });
    paineis?.querySelectorAll(".cardapio-panel").forEach((painel) => {
      const ativo = painel.id === `painel-${id}`;
      painel.classList.toggle("ativo", ativo);
      painel.hidden = !ativo;
    });
  };

  if (tabs && paineis) {
    tabs.innerHTML = categorias
      .map(
        (cat, i) =>
          `<button class="tab" type="button" role="tab" id="tab-${cat.id}" data-id="${cat.id}" aria-controls="painel-${cat.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${cat.nome}</button>`
      )
      .join("");
    paineis.innerHTML = categorias
      .map(
        (cat, i) => `
        <div class="cardapio-panel ${i === 0 ? "ativo" : ""}" id="painel-${cat.id}" role="tabpanel" aria-labelledby="tab-${cat.id}" ${i === 0 ? "" : "hidden"}>
          <div class="menu-layout">
            <div class="menu-photo">
              <picture>
                <source type="image/webp" srcset="${cat.fotoWebp}">
                <img src="${cat.foto}" width="1400" height="933" alt="${cat.nome} da Casa do Rio" loading="lazy">
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
    tabs.addEventListener("keydown", (ev) => {
      const lista = [...tabs.querySelectorAll(".tab")];
      const i = lista.indexOf(document.activeElement);
      if (i < 0) return;
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        const next = ev.key === "ArrowRight" ? (i + 1) % lista.length : (i - 1 + lista.length) % lista.length;
        lista[next].focus();
        mostrarCategoria(lista[next].dataset.id);
      }
    });
    paineis.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-add]");
      if (!btn) return;
      const nome = decodeURIComponent(btn.getAttribute("data-add"));
      pedido.push({
        nome,
        preco: Number(btn.getAttribute("data-preco")),
      });
      renderPedido();
      mostrarToast(`${nome} adicionado ao pedido`);
    });
  }

  const barra = document.getElementById("pedido-bar");
  const drawer = document.getElementById("pedido-drawer");
  const painelDrawer = drawer?.querySelector(".drawer-panel");
  const caixaItens = document.getElementById("pedido-itens");
  let focoAntes = null;

  const totalPedido = () => pedido.reduce((s, i) => s + i.preco, 0);

  const toast = document.getElementById("toast");
  let toastTimer;
  const mostrarToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  };

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
    focoAntes = document.activeElement;
    drawer.hidden = false;
    drawer.classList.add("aberto");
    trava(true);
    painelDrawer?.focus();
  };
  const fecharPedido = () => {
    if (!drawer) return;
    drawer.classList.remove("aberto");
    drawer.hidden = true;
    if (!nav?.classList.contains("open")) trava(false);
    if (focoAntes && typeof focoAntes.focus === "function") focoAntes.focus();
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

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const fecharLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    if (!drawer?.classList.contains("aberto") && !nav?.classList.contains("open")) trava(false);
  };
  document.querySelectorAll("[data-lightbox]").forEach((link) => {
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (!lightbox || !lightboxImg) return;
      const img = link.querySelector("img");
      lightboxImg.src = link.getAttribute("href");
      lightboxImg.alt = img ? img.getAttribute("alt") || "" : "";
      lightbox.hidden = false;
      trava(true);
    });
  });
  document.querySelector("[data-fechar-lightbox]")?.addEventListener("click", fecharLightbox);
  lightbox?.addEventListener("click", (ev) => {
    if (ev.target === lightbox) fecharLightbox();
  });

  const mascaraTel = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1");
    if (d.length <= 7) return d.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  };
  const tel = document.getElementById("reserva-telefone");
  tel?.addEventListener("input", () => {
    tel.value = mascaraTel(tel.value);
  });

  const form = document.getElementById("form-reserva");
  const erro = document.getElementById("reserva-erro");
  if (form) {
    const campoData = form.querySelector('[name="data"]');
    if (campoData) {
      const hoje = new Date();
      const iso = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, "0"),
        String(hoje.getDate()).padStart(2, "0"),
      ].join("-");
      campoData.min = iso;
      campoData.value = iso;
    }
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (erro) {
        erro.hidden = true;
        erro.textContent = "";
      }
      const fd = new FormData(form);
      const nome = String(fd.get("nome") || "").trim();
      if (nome.length < 2) {
        if (erro) {
          erro.textContent = "Informe o nome para a reserva.";
          erro.hidden = false;
        }
        return;
      }
      const dataIso = String(fd.get("data") || "");
      const [yy, mm, dd] = dataIso.split("-").map(Number);
      const dataObj = new Date(yy, (mm || 1) - 1, dd || 1);
      if (dataObj.getDay() === 1) {
        if (erro) {
          erro.textContent = "Na segunda-feira a casa descansa. Escolha terça a domingo.";
          erro.hidden = false;
        }
        return;
      }
      const dataBr = `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yy}`;
      const obs = String(fd.get("obs") || "").trim();
      const fone = String(fd.get("telefone") || "").trim();
      let texto = `Olá! Quero reservar mesa na Casa do Rio.\nNome: ${nome}\nData: ${dataBr}\nHorário: ${fd.get("horario")}\nPessoas: ${fd.get("pessoas")}`;
      if (fone) texto += `\nTelefone: ${fone}`;
      if (obs) texto += `\nObs.: ${obs}`;
      window.open(waLink(texto), "_blank", "noopener,noreferrer");
    });
  }

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (!lightbox?.hidden) fecharLightbox();
    else if (drawer?.classList.contains("aberto")) fecharPedido();
    else if (nav?.classList.contains("open")) fecharMenu();
  });

  renderPedido();
})();
