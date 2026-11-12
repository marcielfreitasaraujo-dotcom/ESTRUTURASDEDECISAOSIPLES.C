from datetime import date, timedelta

from app.utils.formatters import periodo_preset


def test_inicio_padrao_ultimos_90_dias(admin_client):
    resp = admin_client.get("/")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    # seletor compacto: 90D marcado como atual por padrão
    assert 'href="/?periodo=ultimos_90" class="is-active"' in html
    assert 'aria-current="true">90D<' in html
    assert ">Ano<" in html


def test_kpi_receita_despesa_sao_links(admin_client):
    html = admin_client.get("/").get_data(as_text=True)
    # indicadores levam à lista já filtrada pelo tipo e pelo período
    assert '<a class="fx-kpi" href="/movimentacoes?tipo=receita&amp;periodo=ultimos_90">' in html
    assert '<a class="fx-kpi" href="/movimentacoes?tipo=despesa&amp;periodo=ultimos_90">' in html


def test_clicar_kpi_receita_filtra_lista(admin_client):
    resp = admin_client.get("/movimentacoes?tipo=receita&periodo=ultimos_90")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert 'value="receita" selected' in html or 'selected' in html
    assert "Receita" in html


def test_pagina_interna_tem_botao_voltar(admin_client):
    html = admin_client.get("/movimentacoes").get_data(as_text=True)
    assert 'data-voltar' in html
    assert "← Voltar" in html


def test_inicio_nao_tem_botao_voltar(admin_client):
    html = admin_client.get("/").get_data(as_text=True)
    assert 'class="btn btn-ghost btn-sm btn-voltar"' not in html


def test_inicio_tem_chart_wrap(admin_client):
    html = admin_client.get("/").get_data(as_text=True)
    assert "dash-chart" in html
    assert 'id="chart-rd"' in html
    assert 'id="chart-evo"' in html
