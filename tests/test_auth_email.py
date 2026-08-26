from app.extensions import db
from app.models import Usuario
from app.services.email import OUTBOX, limpar_outbox
from app.utils.assinatura import definir_bloqueio_assinatura
from app.utils.tokens import gerar_token_reset, gerar_token_verificacao


def test_cadastro_exige_email_e_envia_verificacao(client, app):
    limpar_outbox()
    with app.app_context():
        definir_bloqueio_assinatura(True)
        db.session.commit()

    resp = client.post(
        "/cadastro",
        data={
            "nome": "Maria Silva",
            "username": "maria@exemplo.com",
            "senha": "senha123",
            "senha2": "senha123",
        },
        follow_redirects=False,
    )
    assert resp.status_code == 302
    with app.app_context():
        u = Usuario.query.filter_by(username="maria@exemplo.com").first()
        assert u is not None
        assert u.email_verificado is False
        assert u.eh_familia is False
    assert any(m["para"] == "maria@exemplo.com" for m in OUTBOX)
    assert "Confirme seu e-mail" in OUTBOX[-1]["assunto"]

    client.get(resp.headers["Location"], follow_redirects=True)
    page = client.get("/aguardando-verificacao")
    assert page.status_code == 200
    assert "Confirme seu e-mail" in page.get_data(as_text=True)
    # Sem verificar, app fica bloqueado
    bloqueado = client.get("/contas", follow_redirects=True)
    assert "Confirme seu e-mail" in bloqueado.get_data(as_text=True)


def test_verificar_email_libera_acesso(client, app):
    limpar_outbox()
    client.post(
        "/cadastro",
        data={
            "nome": "Joao",
            "username": "joao@exemplo.com",
            "senha": "senha123",
            "senha2": "senha123",
        },
    )
    with app.app_context():
        u = Usuario.query.filter_by(username="joao@exemplo.com").first()
        token = gerar_token_verificacao(u.id)
        uid = u.id

    resp = client.get(f"/verificar-email/{token}", follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        assert db.session.get(Usuario, uid).email_verificado is True


def test_confirmar_com_codigo_de_verificacao(client, app):
    from app.services.auth_email import gerar_codigo_verificacao

    limpar_outbox()
    client.post(
        "/cadastro",
        data={
            "nome": "Codigo User",
            "username": "codigo@exemplo.com",
            "senha": "senha123",
            "senha2": "senha123",
        },
        follow_redirects=True,
    )
    with app.app_context():
        u = Usuario.query.filter_by(username="codigo@exemplo.com").first()
        codigo = gerar_codigo_verificacao(u)
        db.session.commit()

    page = client.get("/aguardando-verificacao")
    assert "Código de verificação" in page.get_data(as_text=True)

    resp = client.post(
        "/aguardando-verificacao",
        data={"acao": "codigo", "codigo": codigo},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        u = Usuario.query.filter_by(username="codigo@exemplo.com").first()
        assert u.email_verificado is True


def test_esqueci_senha_e_redefinir(client, app):
    limpar_outbox()
    with app.app_context():
        from app.services.seed import criar_membro_familia

        membro = criar_membro_familia(
            "Reset User",
            "reset@exemplo.com",
            "senha123",
            eh_familia=True,
            email_verificado=True,
            exigir_email=True,
        )
        db.session.commit()
        uid = membro.id

    resp = client.post("/esqueci-senha", data={"username": "reset@exemplo.com"}, follow_redirects=True)
    assert resp.status_code == 200
    assert "enviamos um link" in resp.get_data(as_text=True).lower()
    assert any(m["para"] == "reset@exemplo.com" for m in OUTBOX)

    with app.app_context():
        token = gerar_token_reset(uid)

    resp = client.post(
        f"/redefinir-senha/{token}",
        data={"senha": "nova456", "senha2": "nova456"},
        follow_redirects=False,
    )
    assert resp.status_code == 302
    with app.app_context():
        u = db.session.get(Usuario, uid)
        assert u.verificar_senha("nova456")
        assert not u.verificar_senha("senha123")

    # login com nova senha
    client.get("/logout", follow_redirects=True)
    login = client.post(
        "/login",
        data={"username": "reset@exemplo.com", "senha": "nova456"},
        follow_redirects=False,
    )
    assert login.status_code == 302


def test_login_mostra_esqueci_senha(client):
    html = client.get("/login").get_data(as_text=True)
    assert "Esqueci a senha" in html
    assert "E-mail" in html


def test_cadastro_rejeita_usuario_sem_email(client):
    resp = client.post(
        "/cadastro",
        data={
            "nome": "Sem Email",
            "username": "sememail",
            "senha": "senha123",
            "senha2": "senha123",
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "e-mail válido" in resp.get_data(as_text=True).lower()
