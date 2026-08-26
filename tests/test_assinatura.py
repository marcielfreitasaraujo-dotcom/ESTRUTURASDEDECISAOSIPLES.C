from app.extensions import db
from app.models import Configuracao, Usuario
from app.services.seed import criar_membro_familia
from app.utils.assinatura import bloqueio_assinatura_ativo, definir_bloqueio_assinatura, usuario_tem_acesso


def _login(client, username, senha):
    client.get("/logout", follow_redirects=True)
    resp = client.post("/login", data={"username": username, "senha": senha}, follow_redirects=False)
    assert resp.status_code == 302
    client.get(resp.headers["Location"], follow_redirects=True)
    return client.get("/", follow_redirects=True)


def test_admin_ve_aba_assinatura(admin_client):
    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert admin_client.get("/assinatura").status_code == 200
    assert "Assinatura" in html
    assert "Bloqueio" in html
    home = admin_client.get("/").get_data(as_text=True)
    assert "Assinatura" in home


def test_membro_nao_acessa_aba_assinatura(admin_client, client, app):
    with app.app_context():
        criar_membro_familia("Ana Fam", "ana_ass", "senha123", eh_familia=True)
        db.session.commit()
    _login(client, "ana_ass", "senha123")
    assert client.get("/assinatura").status_code == 403
    home = client.get("/").get_data(as_text=True)
    assert 'href="/assinatura"' not in home


def test_familia_acessa_sem_assinatura(admin_client, client, app):
    with app.app_context():
        criar_membro_familia(
            "Beta Fam",
            "beta_fam",
            "senha123",
            eh_familia=True,
            assinatura_ativa=False,
        )
        db.session.commit()
    resp = _login(client, "beta_fam", "senha123")
    assert resp.status_code == 200
    assert client.get("/contas").status_code == 200
    assert "Assinatura necessária" not in client.get("/").get_data(as_text=True)


def test_sem_familia_sem_pagamento_e_bloqueado(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Pago Nao",
            "pago_nao",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
        assert bloqueio_assinatura_ativo() is True
    _login(client, "pago_nao", "senha123")
    resp = client.get("/contas", follow_redirects=True)
    assert resp.status_code == 200
    assert "Assinatura necessária" in resp.get_data(as_text=True)
    assert client.get("/assinatura/bloqueado").status_code == 200


def test_marcar_pago_libera_acesso(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        membro = criar_membro_familia(
            "Cliente X",
            "cliente_x",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
        membro_id = membro.id

    admin_client.post(f"/assinatura/{membro_id}/pagamento", follow_redirects=True)
    with app.app_context():
        assert db.session.get(Usuario, membro_id).assinatura_ativa is True

    _login(client, "cliente_x", "senha123")
    assert client.get("/contas").status_code == 200
    assert "Assinatura necessária" not in client.get("/").get_data(as_text=True)


def test_desligar_bloqueio_libera_todos(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Emergencia",
            "emerg_user",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()

    admin_client.post("/assinatura/bloqueio", data={"ativo": "0"}, follow_redirects=True)
    with app.app_context():
        assert bloqueio_assinatura_ativo() is False

    _login(client, "emerg_user", "senha123")
    assert client.get("/contas").status_code == 200


def test_saude_continua_ok_com_bloqueio(client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        db.session.commit()
    resp = client.get("/api/saude")
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True


def test_admin_sempre_tem_acesso_mesmo_sem_flags(app):
    with app.app_context():
        admin = Usuario.query.filter_by(perfil="admin").first()
        admin.eh_familia = False
        admin.assinatura_ativa = False
        db.session.commit()
        assert usuario_tem_acesso(admin) is True
