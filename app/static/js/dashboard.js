(() => {
  const data = window.FINUP_CHARTS;
  if (!data || typeof Chart === "undefined") return;

  const css = getComputedStyle(document.documentElement);
  const texto = (css.getPropertyValue("--text") || "#eef6fc").trim();
  const muted = (css.getPropertyValue("--muted") || "#c5d9ea").trim();
  const grade = "rgba(148, 197, 232, 0.18)";
  Chart.defaults.color = texto;
  Chart.defaults.borderColor = grade;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.color = texto;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.color = texto;

  const formatarMoeda = (valor) => {
    const n = Number(valor) || 0;
    const neg = n < 0;
    const [inteiro, frac] = Math.abs(n).toFixed(2).split(".");
    const corpo = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const texto = `R$ ${corpo},${frac}`;
    return neg ? `- ${texto}` : texto;
  };

  const rd = document.getElementById("chart-rd");
  if (rd) {
    new Chart(rd, {
      type: "bar",
      data: {
        labels: data.rd.labels,
        datasets: [
          { label: "Receitas", data: data.rd.receitas, backgroundColor: "#059669", borderRadius: 6 },
          { label: "Despesas", data: data.rd.despesas, backgroundColor: "#e11d48", borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom", labels: { color: texto } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: muted } },
          y: { beginAtZero: true, ticks: { color: muted }, grid: { color: grade } },
        },
      },
    });
  }

  const cat = document.getElementById("chart-cat");
  if (cat) {
    const temGastos = Boolean(data.cat.valores && data.cat.valores.length);
    const valores = temGastos ? data.cat.valores : [1];
    const total = temGastos ? valores.reduce((acc, n) => acc + Number(n || 0), 0) : 0;
    new Chart(cat, {
      type: "doughnut",
      data: {
        labels: temGastos ? data.cat.labels : ["Sem gastos"],
        datasets: [
          {
            data: valores,
            backgroundColor: temGastos && data.cat.cores.length ? data.cat.cores : ["#94a3b8"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 10,
              font: { size: 11 },
              color: texto,
              generateLabels(chart) {
                const dataset = chart.data.datasets[0];
                return chart.data.labels.map((label, i) => {
                  const valor = Number(dataset.data[i] || 0);
                  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
                  const item = temGastos
                    ? `${label} · ${formatarMoeda(valor)} (${pct}%)`
                    : label;
                  return {
                    text: item,
                    fillStyle: Array.isArray(dataset.backgroundColor)
                      ? dataset.backgroundColor[i]
                      : dataset.backgroundColor,
                    strokeStyle: "transparent",
                    fontColor: texto,
                    color: texto,
                    hidden: chart.getDataVisibility(i) === false,
                    datasetIndex: 0,
                    index: i,
                  };
                });
              },
            },
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                if (!temGastos) return " Sem gastos no período";
                const valor = Number(ctx.parsed || 0);
                const pct = total > 0 ? ((valor / total) * 100).toFixed(1).replace(".", ",") : "0,0";
                return ` ${formatarMoeda(valor)} · ${pct}% do total`;
              },
            },
          },
        },
      },
    });
  }

  const evo = document.getElementById("chart-evo");
  if (evo) {
    new Chart(evo, {
      type: "line",
      data: {
        labels: data.evo.labels,
        datasets: [
          {
            label: "Saldo",
            data: data.evo.valores,
            borderColor: "#14b8a6",
            backgroundColor: "rgba(20,184,166,.15)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: muted } },
          y: { beginAtZero: false, ticks: { color: muted }, grid: { color: grade } },
        },
      },
    });
  }
})();
