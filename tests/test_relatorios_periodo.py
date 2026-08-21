from datetime import date

from app.utils.formatters import periodo_do_mes, periodo_preset


def test_periodo_este_ano_e_ano_passado():
    hoje = date.today()
    inicio, fim = periodo_preset("este_ano")
    assert inicio == date(hoje.year, 1, 1)
    assert fim == date(hoje.year, 12, 31)

    inicio, fim = periodo_preset("ano_passado")
    assert inicio == date(hoje.year - 1, 1, 1)
    assert fim == date(hoje.year - 1, 12, 31)


def test_periodo_personalizado_inverte_datas():
    inicio, fim = periodo_preset("personalizado", "2024-12-31", "2024-01-01")
    assert inicio == date(2024, 1, 1)
    assert fim == date(2024, 12, 31)


def test_periodo_do_mes():
    assert periodo_do_mes("2024-02") == (date(2024, 2, 1), date(2024, 2, 29))
    assert periodo_do_mes("2025-01") == (date(2025, 1, 1), date(2025, 1, 31))
    assert periodo_do_mes("abc") is None


def test_relatorio_personalizado_e_mes(admin_client):
    resp = admin_client.get("/relatorios?periodo=personalizado&inicio=2024-01-01&fim=2024-01-31")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "01/01/2024" in html
    assert "31/01/2024" in html
    assert 'type="month"' in html
    assert 'type="date"' in html

    mes = admin_client.get("/relatorios?periodo=mes&mes=2024-03")
    assert mes.status_code == 200
    html_mes = mes.get_data(as_text=True)
    assert "Março de 2024" in html_mes or "01/03/2024" in html_mes


def test_relatorio_este_ano(admin_client):
    resp = admin_client.get("/relatorios?periodo=este_ano")
    assert resp.status_code == 200
    assert f"Ano de {date.today().year}" in resp.get_data(as_text=True)
