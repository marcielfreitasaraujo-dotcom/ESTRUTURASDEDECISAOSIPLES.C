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
    assert "fincasa_sessao_navegador" in html_iniciar
    assert "sessionStorage.setItem" in html_iniciar


def test_pagina_autenticada_inclui_guarda_de_sessao(admin_client):
    resp = admin_client.get("/")
    html = resp.get_data(as_text=True)
    assert "sessao.js" in html
    assert 'data-autenticado="1"' in html
