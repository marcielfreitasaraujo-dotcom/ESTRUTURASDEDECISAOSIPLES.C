from datetime import date, timedelta
from decimal import Decimal

from app.extensions import db
from app.models import Conta, ContaPagar, Movimentacao
from app.services.saldo import saldo_conta


def test_status_atrasado_fica_vermelho(admin_client, app):
    with app.app_context():
        conta = Conta.query.filter_by(nome="Carteira").first()
        titulo = ContaPagar(
            usuario_id=1,
            conta_id=conta.id,
            tipo="pagar",
            descricao="Conta de luz atrasada",
            valor=Decimal("120.00"),
            vencimento=date.today() - timedelta(days=4),
            status="pendente",
            ativo=True,
        )
        db.session.add(titulo)
        db.session.commit()
        titulo_id = titulo.id

    resp = admin_client.get("/vencimentos")
    html = resp.get_data(as_text=True)
    assert resp.status_code == 200
    assert "Conta de luz atrasada" in html
    assert "atrasada" in html
    assert "Atrasado" in html
    assert "texto-atrasado" in html or 'class="atrasada' in html

    detalhe = admin_client.get(f"/vencimentos/{titulo_id}")
    assert "texto-atrasado" in detalhe.get_data(as_text=True)


def test_conta_a_receber_emprestimo(admin_client, app):
    with app.app_context():
        conta_id = Conta.query.filter_by(nome="Nubank").first().id

    resp = admin_client.post(
        "/vencimentos/nova",
        data={
            "tipo": "receber",
            "descricao": "Empréstimo para João",
            "pessoa": "João da Silva",
            "valor": "150,00",
            "vencimento": (date.today() + timedelta(days=10)).isoformat(),
            "conta_id": str(conta_id),
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    lista = admin_client.get("/vencimentos?tipo=receber")
    html = lista.get_data(as_text=True)
    assert "Empréstimo para João" in html
    assert "João da Silva" in html
    assert "Atrasado" not in html or "Empréstimo para João" in html


def test_quitar_pagar_atualiza_saldo(admin_client, app):
    with app.app_context():
        conta = Conta.query.filter_by(nome="Nubank").first()
        antes = saldo_conta(conta)
        titulo = ContaPagar(
            usuario_id=1,
            conta_id=conta.id,
            tipo="pagar",
            descricao="Boleto teste",
            valor=Decimal("80.00"),
            vencimento=date.today() + timedelta(days=2),
            status="pendente",
            ativo=True,
        )
        db.session.add(titulo)
        db.session.commit()
        ids = (conta.id, titulo.id)

    admin_client.post(
        f"/vencimentos/{ids[1]}/quitar",
        data={
            "conta_id": str(ids[0]),
            "valor": "80,00",
            "data_pagamento": date.today().isoformat(),
            "forma_pagamento": "pix",
            "lancar": "1",
        },
        follow_redirects=True,
    )
    with app.app_context():
        titulo = db.session.get(ContaPagar, ids[1])
        conta = db.session.get(Conta, ids[0])
        assert titulo.quitado
        assert titulo.status == "pago"
        assert titulo.data_pagamento == date.today()
        assert saldo_conta(conta) == antes - Decimal("80.00")
        assert Movimentacao.query.filter_by(descricao="Boleto teste").first()


def test_quitar_receber_aumenta_saldo(admin_client, app):
    with app.app_context():
        conta = Conta.query.filter_by(nome="Carteira").first()
        antes = saldo_conta(conta)
        titulo = ContaPagar(
            usuario_id=1,
            conta_id=conta.id,
            tipo="receber",
            descricao="Empréstimo da Ana",
            pessoa="Ana",
            valor=Decimal("50.00"),
            vencimento=date.today() - timedelta(days=1),
            status="atrasado",
            ativo=True,
        )
        db.session.add(titulo)
        db.session.commit()
        ids = (conta.id, titulo.id)

    admin_client.post(
        f"/vencimentos/{ids[1]}/quitar",
        data={
            "conta_id": str(ids[0]),
            "valor": "50,00",
            "data_pagamento": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
            "lancar": "1",
        },
        follow_redirects=True,
    )
    with app.app_context():
        titulo = db.session.get(ContaPagar, ids[1])
        conta = db.session.get(Conta, ids[0])
        assert titulo.status == "recebido"
        assert saldo_conta(conta) == antes + Decimal("50.00")


def test_usuario_nao_ve_titulo_alheio(app, client):
    from app.models import Usuario

    with app.app_context():
        ana = Usuario(nome="Ana", username="ana2", perfil="usuario", ativo=True)
        ana.definir_senha("senha123")
        beta = Usuario(nome="Beta", username="beta2", perfil="usuario", ativo=True)
        beta.definir_senha("senha123")
        db.session.add_all([ana, beta])
        db.session.flush()
        conta = Conta(usuario_id=ana.id, nome="Carteira Ana", tipo="carteira", saldo_inicial=0)
        db.session.add(conta)
        db.session.flush()
        titulo = ContaPagar(
            usuario_id=ana.id,
            conta_id=conta.id,
            tipo="pagar",
            descricao="Privado Ana",
            valor=Decimal("10.00"),
            vencimento=date.today(),
            ativo=True,
        )
        db.session.add(titulo)
        db.session.commit()
        titulo_id = titulo.id

    client.post("/login", data={"username": "beta2", "senha": "senha123"})
    assert client.get(f"/vencimentos/{titulo_id}").status_code == 403
