from datetime import date
from decimal import Decimal
from io import BytesIO

from app.extensions import db
from app.models import Categoria, Conta, Movimentacao, Usuario
from app.services.saldo import saldo_conta
from app.services.seed import inserir_dados_demo
from app.utils.formatters import formatar_moeda, parse_moeda


PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082"
)


def test_login_invalido(client):
    resp = client.post("/login", data={"username": "admin", "senha": "errada"})
    assert resp.status_code == 200
    assert "inválidos" in resp.get_data(as_text=True)


def test_login_mostra_logo(client):
    html = client.get("/login").get_data(as_text=True)
    assert "img/logo.png" in html
    assert "brand-logo-capa" in html


def test_login_e_dashboard(admin_client):
    resp = admin_client.get("/")
    assert resp.status_code == 200
    assert "Olá" in resp.get_data(as_text=True)
    assert "img/logo.png" in resp.get_data(as_text=True)


def test_configuracoes_tema_visual(admin_client):
    html = admin_client.get("/configuracoes").get_data(as_text=True)
    assert "Aparência" in html
    assert "tema-preview-claro" in html
    assert "tema-preview-escuro" in html


def test_parse_moeda():
    assert parse_moeda("35,00") == Decimal("35.00")
    assert parse_moeda("1.234,56") == Decimal("1234.56")
    assert formatar_moeda(Decimal("1234.5")) == "R$ 1.234,50"


def test_lancar_despesa_atualiza_saldo(admin_client, app):
    with app.app_context():
        carteira = Conta.query.filter_by(nome="Carteira").first()
        saldo_antes = saldo_conta(carteira)
        conta_id = carteira.id

    resp = admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "despesa",
            "valor": "35,00",
            "descricao": "Combustível",
            "conta_id": str(conta_id),
            "data": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "registrada" in resp.get_data(as_text=True)

    with app.app_context():
        carteira = db.session.get(Conta, conta_id)
        assert saldo_conta(carteira) == saldo_antes - Decimal("35.00")


def test_receita_aumenta_saldo(admin_client, app):
    with app.app_context():
        conta = Conta.query.filter_by(nome="Nubank").first()
        antes = saldo_conta(conta)
        conta_id = conta.id
        salario = Categoria.query.filter_by(nome="Salário").first()
        cat_id = salario.id

    admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "receita",
            "valor": "100,00",
            "descricao": "Extra",
            "conta_id": str(conta_id),
            "categoria_id": str(cat_id),
            "data": date.today().isoformat(),
            "forma_pagamento": "pix",
        },
        follow_redirects=True,
    )
    with app.app_context():
        conta = db.session.get(Conta, conta_id)
        assert saldo_conta(conta) == antes + Decimal("100.00")


def test_transferencia_nao_e_receita_nem_despesa(admin_client, app):
    with app.app_context():
        origem = Conta.query.filter_by(nome="Nubank").first()
        destino = Conta.query.filter_by(nome="Carteira").first()
        s_origem = saldo_conta(origem)
        s_destino = saldo_conta(destino)
        ids = (origem.id, destino.id)

    admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "transferencia",
            "valor": "50,00",
            "descricao": "Saque",
            "conta_id": str(ids[0]),
            "conta_destino_id": str(ids[1]),
            "data": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
        },
        follow_redirects=True,
    )
    with app.app_context():
        origem = db.session.get(Conta, ids[0])
        destino = db.session.get(Conta, ids[1])
        assert saldo_conta(origem) == s_origem - Decimal("50.00")
        assert saldo_conta(destino) == s_destino + Decimal("50.00")
        assert Movimentacao.query.filter_by(tipo="transferencia", descricao="Saque").first()


def test_exclusao_logica_recalcula_saldo(admin_client, app):
    with app.app_context():
        conta = Conta.query.filter_by(nome="Carteira").first()
        conta_id = conta.id
        antes = saldo_conta(conta)

    admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "despesa",
            "valor": "10,00",
            "descricao": "Temporaria",
            "conta_id": str(conta_id),
            "data": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
        },
        follow_redirects=True,
    )
    with app.app_context():
        mov = Movimentacao.query.filter_by(descricao="Temporaria").first()
        mov_id = mov.id
        assert saldo_conta(db.session.get(Conta, conta_id)) == antes - Decimal("10.00")

    admin_client.post(f"/movimentacoes/{mov_id}/excluir", follow_redirects=True)
    with app.app_context():
        mov = db.session.get(Movimentacao, mov_id)
        assert mov.ativo is False
        assert saldo_conta(db.session.get(Conta, conta_id)) == antes


def test_comprovante_png(admin_client, app):
    with app.app_context():
        conta_id = Conta.query.filter_by(nome="Carteira").first().id

    admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "despesa",
            "valor": "12,00",
            "descricao": "Com nota",
            "conta_id": str(conta_id),
            "data": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
            "comprovante": (BytesIO(PNG_1PX), "nota.png"),
        },
        follow_redirects=True,
    )
    with app.app_context():
        mov = Movimentacao.query.filter_by(descricao="Com nota").first()
        assert mov is not None
        assert mov.comprovante is not None
        assert mov.comprovante.mime_type == "image/png"
        comp_id = mov.comprovante.id

    resp = admin_client.get(f"/comprovantes/{comp_id}")
    assert resp.status_code == 200
    assert resp.mimetype == "image/png"


def test_usuario_nao_acessa_lancamento_alheio(app, client):
    with app.app_context():
        ana = Usuario(nome="Ana", username="ana", perfil="usuario", ativo=True)
        ana.definir_senha("senha123")
        beta = Usuario(nome="Beta", username="beta", perfil="usuario", ativo=True)
        beta.definir_senha("senha123")
        db.session.add_all([ana, beta])
        db.session.flush()
        conta = Conta(usuario_id=ana.id, nome="Carteira Ana", tipo="carteira", saldo_inicial=0)
        db.session.add(conta)
        db.session.flush()
        mov = Movimentacao(
            usuario_id=ana.id,
            conta_id=conta.id,
            tipo="despesa",
            descricao="Privado",
            valor=Decimal("20.00"),
            data=date.today(),
            forma_pagamento="dinheiro",
            criado_por=ana.id,
        )
        db.session.add(mov)
        db.session.commit()
        mov_id = mov.id

    client.post("/login", data={"username": "ana", "senha": "senha123"})
    assert client.get(f"/movimentacoes/{mov_id}").status_code == 200
    client.get("/logout")
    client.post("/login", data={"username": "beta", "senha": "senha123"})
    assert client.get(f"/movimentacoes/{mov_id}").status_code == 403


def test_demo_idempotente(app):
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        assert inserir_dados_demo(admin) is True
        assert inserir_dados_demo(admin) is False
        qtd = Movimentacao.query.filter_by(usuario_id=admin.id, ativo=True).count()
        assert qtd >= 20
