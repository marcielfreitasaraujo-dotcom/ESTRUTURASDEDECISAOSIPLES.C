from flask import session


def test_login_nao_grava_cookie_permanente(client):
    resp = client.post("/login", data={"username": "admin", "senha": "admin123"})
    assert resp.status_code == 302
    assert "/sessao/iniciar" in (resp.headers.get("Location") or "")
    cookies = resp.headers.getlist("Set-Cookie")
    texto = "\n".join(cookies)
    assert "remember_token=" not in texto.lower()
    sessao = [c for c in cookies if "session=" in c.lower()]
    assert sessao, cookies
    for item in sessao:
        baixo = item.lower()
        assert "max-age=" not in baixo
        assert "expires=" not in baixo


def test_sessao_nao_e_permanente_depois_do_login(client):
    with client:
        client.post("/login", data={"username": "admin", "senha": "admin123"})
        assert session.permanent is False


def test_login_marca_script_de_sessao_do_navegador(client):
    pagina = client.get("/login")
    html = pagina.get_data(as_text=True)
    assert "fechar a aba" in html

    resp = client.post("/login", data={"username": "admin", "senha": "admin123"})
    assert "/sessao/iniciar" in (resp.headers.get("Location") or "")

    iniciar = client.get(resp.headers["Location"])
    html_iniciar = iniciar.get_data(as_text=True)
    assert "finup_sessao_navegador" in html_iniciar
    assert "sessionStorage.setItem" in html_iniciar
    assert 'window.name = "finup_ativo"' in html_iniciar


def test_login_autenticado_vai_para_verificacao(client):
    client.post("/login", data={"username": "admin", "senha": "admin123"})
    resp = client.get("/login")
    assert resp.status_code == 302
    assert "/sessao/verificar" in (resp.headers.get("Location") or "")

    pagina = client.get(resp.headers["Location"])
    html = pagina.get_data(as_text=True)
    assert "finup_sessao_navegador" in html
    assert "finup_ativo" in html


def test_api_sessao_fechar_encerra_login(client):
    client.post("/login", data={"username": "admin", "senha": "admin123"})
    resp = client.post("/api/sessao/fechar")
    assert resp.status_code == 204

    home = client.get("/")
    assert home.status_code == 302
    assert "/login" in (home.headers.get("Location") or "")


def test_pagina_autenticada_inclui_guarda_de_sessao(admin_client):
    resp = admin_client.get("/")
    html = resp.get_data(as_text=True)
    assert "sessao.js" in html
    assert 'data-autenticado="1"' in html
    assert "finup_sessao_navegador" in html
    assert "finup_ativo" in html

    js = admin_client.get("/static/js/sessao.js")
    assert js.status_code == 200
    assert "/api/sessao/fechar" in js.get_data(as_text=True)
