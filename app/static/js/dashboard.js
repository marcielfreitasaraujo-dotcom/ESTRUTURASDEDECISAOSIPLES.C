// Gráficos do Início no FinUP Design System (tema escuro, cores dos tokens fx).
(() => {
  const data = window.FINUP_CHARTS;
  if (!data || typeof Chart === "undefined") return;

  const registrar = window.finupRegistrarGrafico || ((c) => c);
  const css = getComputedStyle(document.documentElement);
  const token = (nome, padrao) => (css.getPropertyValue(nome) || padrao).trim() || padrao;

  const cor = {
    texto: token("--fx-text-2", "#8296a9"),
    fraco: token("--fx-text-3", "#5d7286"),
    grade: "rgba(130, 150, 169, 0.12)",
    pos: token("--fx-positive", "#36c9a5"),
    neg: token("--fx-negative", "#e65d69"),
    info: token("--fx-info", "#5aa9e6"),
    superficie: token("--fx-surface", "#0d2438"),
  };

  Chart.defaults.color = cor.texto;
  Chart.defaults.borderColor = cor.grade;
  Chart.defaults.font.family = '"Inter", system-ui, sans-serif';
  Chart.defaults.font.size = 12;

  const formatarMoeda = (valor) => {
    const n = Number(valor) || 0;
    const [inteiro, frac] = Math.abs(n).toFixed(2).split(".");
    const corpo = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${n < 0 ? "− " : ""}R$ ${corpo},${frac}`;
  };
  const formatarCurto = (valor) => {
    const n = Math.abs(Number(valor) || 0);
    const s = n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")}k` : `${Math.round(n)}`;
    return `${valor < 0 ? "−" : ""}${s}`;
  };

  const tooltip = {
    backgroundColor: "#0a1e30",
    borderColor: "#26496a",
    borderWidth: 1,
    titleColor: "#f4f8fb",
    bodyColor: "#dce7ef",
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxWidth: 8,
    boxHeight: 8,
    usePointStyle: true,
    callbacks: { label: (ctx) => ` ${ctx.dataset.label || ""}: ${formatarMoeda(ctx.parsed.y ?? ctx.parsed)}` },
  };

  const gradiente = (canvas, rgb) => {
    const g = canvas.getContext("2d").createLinearGradient(0, 0, 0, canvas.clientHeight || 260);
    g.addColorStop(0, `rgba(${rgb}, 0.28)`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    return g;
  };

  const eixos = (maxTicksX) => ({
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: cor.fraco, maxRotation: 0, autoSkip: true, maxTicksLimit: maxTicksX },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: cor.grade, drawTicks: false },
      ticks: { color: cor.fraco, padding: 8, maxTicksLimit: 5, callback: formatarCurto },
    },
  });

  const base = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
  };

  // Receitas × despesas: duas áreas suaves
  const rd = document.getElementById("chart-rd");
  if (rd) {
    registrar(
      new Chart(rd, {
        type: "line",
        data: {
          labels: data.rd.labels,
          datasets: [
            {
              label: "Receitas", data: data.rd.receitas, borderColor: cor.pos,
              backgroundColor: gradiente(rd, "54, 201, 165"), fill: true,
              tension: 0.35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
            },
            {
              label: "Despesas", data: data.rd.despesas, borderColor: cor.neg,
              backgroundColor: gradiente(rd, "230, 93, 105"), fill: true,
              tension: 0.35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
            },
          ],
        },
        options: { ...base, plugins: { legend: { display: false }, tooltip }, scales: eixos(10) },
      })
    );
  }

  // Gastos por categoria: rosca fina; a legenda fica no HTML ao lado
  const cat = document.getElementById("chart-cat");
  if (cat && data.cat.valores && data.cat.valores.length) {
    const total = data.cat.valores.reduce((a, n) => a + Number(n || 0), 0);
    registrar(
      new Chart(cat, {
        type: "doughnut",
        data: {
          labels: data.cat.labels,
          datasets: [{
            data: data.cat.valores,
            backgroundColor: data.cat.cores,
            borderColor: cor.superficie,
            borderWidth: 2,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: false,
          animation: false,
          cutout: "72%",
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltip,
              callbacks: {
                label: (ctx) => {
                  const v = Number(ctx.parsed || 0);
                  const pct = total ? ((v / total) * 100).toFixed(1).replace(".", ",") : "0";
                  return ` ${ctx.label}: ${formatarMoeda(v)} · ${pct}%`;
                },
              },
            },
          },
        },
      })
    );
  }

  // Evolução do saldo: linha única
  const evo = document.getElementById("chart-evo");
  if (evo) {
    const escala = eixos(6);
    escala.y.beginAtZero = false;
    registrar(
      new Chart(evo, {
        type: "line",
        data: {
          labels: data.evo.labels,
          datasets: [{
            label: "Saldo", data: data.evo.valores, borderColor: cor.info,
            backgroundColor: gradiente(evo, "90, 169, 230"), fill: true,
            tension: 0.35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
          }],
        },
        options: { ...base, plugins: { legend: { display: false }, tooltip }, scales: escala },
      })
    );
  }

  window.finupAgendarRedimensionarGraficos?.();
})();
