(() => {
  window.FINUP_CHART_INSTANCES = window.FINUP_CHART_INSTANCES || [];

  window.finupRegistrarGrafico = (chart) => {
    if (chart && !window.FINUP_CHART_INSTANCES.includes(chart)) {
      window.FINUP_CHART_INSTANCES.push(chart);
    }
    return chart;
  };

  window.finupRedimensionarGraficos = () => {
    window.FINUP_CHART_INSTANCES.forEach((chart) => {
      try {
        chart.resize();
      } catch (_erro) {
        /* ignore */
      }
    });
  };

  window.finupAgendarRedimensionarGraficos = () => {
    window.finupRedimensionarGraficos();
    window.setTimeout(window.finupRedimensionarGraficos, 220);
    window.setTimeout(window.finupRedimensionarGraficos, 420);
  };
})();
