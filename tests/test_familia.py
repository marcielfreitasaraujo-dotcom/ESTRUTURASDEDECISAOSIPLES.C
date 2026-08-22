from decimal import Decimal

from app.extensions import db
from app.models import Conta, Movimentacao, Usuario
from app.services.seed import criar_membro_familia


def test_admin_cria_membro_com_contas_proprias(admin_client, app):
    resp = admin_client.post(
        "/configuracoes/familia",
        data={
            "nome": "Ana",
            "username": "ana.casa",
            "senha": "familia1",
            "perfil": "usuario",
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "ana.casa" in html
    with app.app_context():
        ana = Usuario.query.filter_by(username="ana.casa").first()
        assert ana is not None
        assert ana.ver_familia is False
        assert Conta.query.filter_by(usuario_id=ana.id).count() >= 1


def test_membro_nao_ve_conta_do_admin(app, client):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        criar_membro_familia("Ana", "ana.casa", "familia1", ver_familia=False)
        db.session.commit()
        conta_id = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first().id

    client.post("/login", data={"username": "ana.casa", "senha": "familia1"})
    resp = client.get("/contas")
    assert resp.status_code == 200
    assert client.get(f"/contas/{conta_id}").status_code == 403


def test_usuario_isolado_nao_ve_casa(app, client):
    with app.app_context():
        criar_membro_familia("Beta", "beta.iso", "senha123", ver_familia=False)
        db.session.commit()
        admin = Usuario.query.filter_by(username="admin").first()
        conta_casa = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
        conta_id = conta_casa.id

    client.post("/login", data={"username": "beta.iso", "senha": "senha123"})
    assert client.get(f"/contas/{conta_id}").status_code == 403


def test_logout_exige_login_de_novo(admin_client, client):
    assert client.get("/").status_code == 200
    client.get("/logout", follow_redirects=True)
    inicio = client.get("/", follow_redirects=False)
    assert inicio.status_code == 200
    assert "Entrar no sistema" in inicio.get_data(as_text=True)
    resp = client.get("/movimentacoes", follow_redirects=False)
    assert resp.status_code in (302, 401)
    loc = resp.headers.get("Location", "")
    assert "login" in loc or resp.status_code == 401


def test_zerar_apaga_lancamentos_e_mantem_usuarios(admin_client, app):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        conta = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
        from datetime import date

        db.session.add(
            Movimentacao(
                usuario_id=admin.id,
                conta_id=conta.id,
                tipo="despesa",
                descricao="Teste zerar",
                valor=Decimal("10.00"),
                data=date.today(),
                forma_pagamento="dinheiro",
                criado_por=admin.id,
            )
        )
        conta.saldo_inicial = Decimal("50.00")
        db.session.commit()

    resp = admin_client.post(
        "/configuracoes/zerar",
        data={"confirmacao": "ZERAR"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        assert Movimentacao.query.count() == 0
        assert Usuario.query.filter_by(username="admin").first() is not None
        carteira = Conta.query.filter_by(nome="Carteira").first()
        assert carteira.saldo_inicial == Decimal("0.00")


def test_zerar_exige_confirmacao(admin_client, app):
    from datetime import date

    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        conta = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
        db.session.add(
            Movimentacao(
                usuario_id=admin.id,
                conta_id=conta.id,
                tipo="despesa",
                descricao="Nao zerar",
                valor=Decimal("5.00"),
                data=date.today(),
                forma_pagamento="dinheiro",
                criado_por=admin.id,
            )
        )
        db.session.commit()

    resp = admin_client.post(
        "/configuracoes/zerar",
        data={"confirmacao": "nao"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        assert Movimentacao.query.count() == 1
