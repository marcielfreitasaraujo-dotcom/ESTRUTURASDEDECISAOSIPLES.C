from flask import session


def test_login_nao_grava_cookie_permanente(client):
    resp = client.post("/login", data={"username": "admin", "senha": "admin123"})
    assert resp.status_code == 302
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
    assert "sessao.js" in html
    assert "data-login-sessao" in html
    assert "fechar o navegador" in html
