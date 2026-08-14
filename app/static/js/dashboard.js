(() => {
  const data = window.FINCASA_CHARTS;
  if (!data || typeof Chart === "undefined") return;

  const text = getComputedStyle(document.documentElement).getPropertyValue("--text").trim();
  const muted = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
  Chart.defaults.color = muted;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;

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
        plugins: { legend: { position: "bottom" } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });
  }

  const cat = document.getElementById("chart-cat");
  if (cat) {
    new Chart(cat, {
      type: "doughnut",
      data: {
        labels: data.cat.labels.length ? data.cat.labels : ["Sem gastos"],
        datasets: [
          {
            data: data.cat.valores.length ? data.cat.valores : [1],
            backgroundColor: data.cat.cores.length
              ? data.cat.cores
              : ["#94a3b8"],
            borderWidth: 0,
          },
        ],
      },
      options: { plugins: { legend: { position: "bottom" } }, cutout: "62%" },
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
        scales: { x: { grid: { display: false } }, y: { beginAtZero: false } },
      },
    });
  }
})();
