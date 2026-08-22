def test_site_inicial_publico(client):
    resp = client.get("/")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "FinUP" in html
    assert "Seu dinheiro" in html
    assert "Seus planos" in html
    assert "Entrar no sistema" in html
    assert 'href="/login"' in html
    assert "css/site.css" in html
    assert "js/site.js" in html
    assert "Lançamento rápido" in html
    assert "id=\"recursos\"" in html
    assert "id=\"familia\"" in html
    assert "id=\"seguranca\"" in html
    assert "app-shell" not in html
    assert "data-autenticado" not in html


def test_site_inicial_logado_abre_dashboard(admin_client):
    resp = admin_client.get("/")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "Olá" in html
    assert "Resumo financeiro" in html
    assert "css/site.css" not in html


def test_paginas_internas_continuam_exigindo_login(client):
    for caminho in ("/movimentacoes", "/contas", "/configuracoes", "/vencimentos"):
        resp = client.get(caminho)
        assert resp.status_code == 302, caminho
        assert "/login" in (resp.headers.get("Location") or "")


def test_login_tem_volta_ao_inicio(client):
    html = client.get("/login").get_data(as_text=True)
    assert "Voltar ao início" in html
    assert 'href="/"' in html
