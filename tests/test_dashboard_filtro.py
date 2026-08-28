from datetime import date, timedelta

from app.utils.formatters import periodo_preset


def test_inicio_padrao_ultimos_90_dias(admin_client):
    resp = admin_client.get("/")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "90 dias" in html
    assert "Este ano" in html
    assert 'name="periodo" value="ultimos_90"' in html
    # pill ativo no padrão
    assert 'class="pill ativo" name="periodo" value="ultimos_90"' in html or (
        'value="ultimos_90"' in html and "ativo" in html
    )


def test_kpi_receita_despesa_sao_links(admin_client):
    html = admin_client.get("/").get_data(as_text=True)
    assert 'href="/movimentacoes?periodo=ultimos_90&amp;tipo=receita"' in html or (
        'tipo=receita' in html and "periodo=ultimos_90" in html
    )
    assert "tipo=despesa" in html
    assert "Ver só receitas" in html
    assert "Ver só despesas" in html


def test_clicar_kpi_receita_filtra_lista(admin_client):
    resp = admin_client.get("/movimentacoes?tipo=receita&periodo=ultimos_90")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert 'value="receita" selected' in html or 'selected' in html
    assert "Receita" in html


def test_periodo_ultimos_90_range():
    hoje = date.today()
    inicio, fim = periodo_preset("ultimos_90")
    assert fim == hoje
    assert inicio == hoje - timedelta(days=89)
