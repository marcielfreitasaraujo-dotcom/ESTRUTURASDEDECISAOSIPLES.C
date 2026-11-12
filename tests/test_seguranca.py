from app.extensions import db
from app.models import Usuario
from app.services.seed import criar_membro_familia


def _login(client, usuario, senha, next_url=None):
    url = "/login" + (f"?next={next_url}" if next_url else "")
    return client.post(url, data={"username": usuario, "senha": senha}, follow_redirects=False)


def test_login_bloqueia_apos_muitas_senhas_erradas(client):
    for _ in range(8):
        assert _login(client, "admin", "errada").status_code == 200
    resp = _login(client, "admin", "admin123")
    assert resp.status_code == 429
    assert "Muitas tentativas" in resp.get_data(as_text=True)


def test_login_certo_zera_contador(client):
    for _ in range(5):
        _login(client, "admin", "errada")
    resp = _login(client, "admin", "admin123")
    assert resp.status_code == 302
    client.get("/logout")
    for _ in range(5):
        assert _login(client, "admin", "errada").status_code == 200


def test_next_externo_nao_redireciona_para_fora(client):
    resp = _login(client, "admin", "admin123", next_url="//site-malicioso.com")
    destino = resp.headers["Location"]
    resp = client.get(destino)
    pagina = resp.get_data(as_text=True)
    assert "site-malicioso" not in pagina


def test_cabecalhos_de_seguranca(client):
    resp = client.get("/login")
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "SAMEORIGIN"


def test_codigo_de_email_bloqueia_apos_erros(client, app):
    with app.app_context():
        criar_membro_familia(
            "Novo",
            "novo@email.com",
            "senha123",
            perfil="usuario",
            eh_familia=False,
            assinatura_ativa=True,
            email_verificado=False,
            exigir_email=True,
        )
        db.session.commit()
    resp = _login(client, "novo@email.com", "senha123")
    client.get(resp.headers["Location"])
    for _ in range(6):
        r = client.post("/aguardando-verificacao", data={"acao": "codigo", "codigo": "000000"})
        assert r.status_code == 200
    r = client.post("/aguardando-verificacao", data={"acao": "codigo", "codigo": "000000"})
    assert r.status_code == 429
    with app.app_context():
        assert Usuario.query.filter_by(username="novo@email.com").one().email_verificado is False
