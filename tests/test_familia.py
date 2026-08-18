from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Conta, Movimentacao, Usuario
from app.services.seed import criar_membro_familia


def test_admin_cria_membro_com_financeiro_proprio(admin_client, app):
    resp = admin_client.post(
        "/configuracoes/familia",
        data={
            "nome": "Marciel",
            "username": "marciel",
            "senha": "familia1",
            "perfil": "usuario",
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "marciel" in html
    with app.app_context():
        membro = Usuario.query.filter_by(username="marciel").first()
        assert membro is not None
        assert membro.ver_familia is False
        assert Conta.query.filter_by(usuario_id=membro.id, ativo=True).count() >= 1


def test_membro_nao_ve_conta_do_admin(app, client):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        criar_membro_familia("Marciel", "marciel", "familia1")
        db.session.commit()
        conta_admin = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
        conta_id = conta_admin.id

    client.post("/login", data={"username": "marciel", "senha": "familia1"})
    resp = client.get("/contas")
    assert resp.status_code == 200
    assert client.get(f"/contas/{conta_id}").status_code == 403


def test_membro_ve_somente_as_proprias_contas(app, client):
    with app.app_context():
        criar_membro_familia("Marciel", "marciel", "familia1")
        db.session.commit()
        membro = Usuario.query.filter_by(username="marciel").first()
        conta_id = Conta.query.filter_by(usuario_id=membro.id, nome="Carteira").first().id

    client.post("/login", data={"username": "marciel", "senha": "familia1"})
    resp = client.get("/contas")
    assert resp.status_code == 200
    assert "Carteira" in resp.get_data(as_text=True)
    assert client.get(f"/contas/{conta_id}").status_code == 200


def test_so_dono_edita_e_exclui_lancamento(app, client):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        criar_membro_familia("Marciel", "marciel", "familia1")
        db.session.commit()
        membro = Usuario.query.filter_by(username="marciel").first()
        conta = Conta.query.filter_by(usuario_id=membro.id, nome="Carteira").first()
        mov = Movimentacao(
            usuario_id=membro.id,
            conta_id=conta.id,
            tipo="despesa",
            descricao="Almoço do Marciel",
            valor=Decimal("32.00"),
            data=date.today(),
            forma_pagamento="pix",
            criado_por=membro.id,
        )
        db.session.add(mov)
        db.session.commit()
        mov_id = mov.id
        conta_admin_id = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first().id

    client.post("/login", data={"username": "marciel", "senha": "familia1"})
    assert client.get(f"/movimentacoes/{mov_id}").status_code == 200

    client.get("/logout")
    client.post("/login", data={"username": "admin", "senha": "admin123"})
    assert client.get(f"/movimentacoes/{mov_id}").status_code == 403
    editar = client.post(
        f"/movimentacoes/{mov_id}/editar",
        data={
            "tipo": "despesa",
            "valor": "1,00",
            "descricao": "Tentativa do admin",
            "conta_id": str(conta_admin_id),
            "data": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
        },
    )
    assert editar.status_code == 403
    excluir = client.post(f"/movimentacoes/{mov_id}/excluir")
    assert excluir.status_code == 403

    with app.app_context():
        mov = db.session.get(Movimentacao, mov_id)
        assert mov.descricao == "Almoço do Marciel"
        assert mov.ativo is True


def test_sair_pede_senha_de_novo(admin_client, client):
    assert client.get("/").status_code == 200
    sair = client.get("/logout", follow_redirects=True)
    html = sair.get_data(as_text=True)
    assert sair.status_code == 200
    assert "name=\"username\"" in html or "name='username'" in html
    assert "Você saiu" in html
    protegida = client.get("/", follow_redirects=False)
    assert protegida.status_code in (302, 401)
    assert "/login" in (protegida.headers.get("Location") or "")
    sem_senha = client.post("/login", data={"username": "admin", "senha": ""})
    assert "Dashboard" not in sem_senha.get_data(as_text=True)
    de_novo = client.post(
        "/login",
        data={"username": "admin", "senha": "admin123"},
        follow_redirects=True,
    )
    assert de_novo.status_code == 200
    assert "Dashboard" in de_novo.get_data(as_text=True)


def test_zerar_apaga_lancamentos_e_mantem_usuarios(admin_client, app):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        conta = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
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
        admin = Usuario.query.filter_by(username="admin").first()
        assert admin is not None
        carteira = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
        assert carteira.saldo_inicial == Decimal("0.00")


def test_zerar_exige_confirmacao(admin_client, app):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        conta = Conta.query.filter_by(usuario_id=admin.id, nome="Carteira").first()
        db.session.add(
            Movimentacao(
                usuario_id=admin.id,
                conta_id=conta.id,
                tipo="despesa",
                descricao="Nao apagar",
                valor=Decimal("5.00"),
                data=date.today(),
                forma_pagamento="dinheiro",
                criado_por=admin.id,
            )
        )
        db.session.commit()
    admin_client.post("/configuracoes/zerar", data={"confirmacao": "nao"}, follow_redirects=True)
    with app.app_context():
        assert Movimentacao.query.filter_by(descricao="Nao apagar").count() == 1
