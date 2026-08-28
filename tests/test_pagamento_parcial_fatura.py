from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Cartao, Conta, Movimentacao, Parcela
from app.services.cartoes import competencia_da_compra, limite_usado, parcelas_competencia, total_fatura
from app.services.saldo import saldo_conta


def _criar_cartao_com_compra(admin_client, app, nome="Visa parcial", valor="300,00", parcelas="1"):
    resp = admin_client.post(
        "/cartoes/nova",
        data={
            "nome": nome,
            "limite": "2000,00",
            "dia_fechamento": "28",
            "dia_vencimento": "10",
        },
    )
    assert resp.status_code == 302
    with app.app_context():
        cartao_id = Cartao.query.filter_by(nome=nome).first().id
        conta_id = Conta.query.filter_by(nome="Carteira").first().id
        saldo_antes = saldo_conta(Conta.query.filter_by(nome="Carteira").first())

    admin_client.post(
        f"/cartoes/{cartao_id}/compra",
        data={
            "descricao": "Compra parcial",
            "valor": valor,
            "data": date.today().isoformat(),
            "parcelas": parcelas,
        },
    )
    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        competencia = competencia_da_compra(cartao, date.today())
    return cartao_id, conta_id, competencia, saldo_antes


def test_detalhe_tem_campo_valor_pagamento(admin_client, app):
    cartao_id, *_ = _criar_cartao_com_compra(admin_client, app, nome="Elo form valor")
    html = admin_client.get(f"/cartoes/{cartao_id}").get_data(as_text=True)
    assert 'name="valor"' in html
    assert "Valor do pagamento" in html
    assert "só uma parte" in html.lower() or "parte que vai pagar" in html.lower()


def test_pagamento_parcial_depois_quita_resto(admin_client, app):
    cartao_id, conta_id, competencia, saldo_antes = _criar_cartao_com_compra(
        admin_client, app, nome="Master parcial", valor="200,00"
    )

    parcial = admin_client.post(
        f"/cartoes/{cartao_id}/pagar",
        data={
            "conta_id": str(conta_id),
            "competencia": competencia.strftime("%Y-%m"),
            "data_pagamento": date.today().isoformat(),
            "valor": "80,00",
        },
        follow_redirects=True,
    )
    assert parcial.status_code == 200
    html = parcial.get_data(as_text=True).lower()
    assert "parcial" in html
    assert "120" in html or "r$ 120" in html

    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        aberto = total_fatura(parcelas_competencia(cartao, competencia), somente_abertas=True)
        assert aberto == Decimal("120.00")
        assert limite_usado(cartao) == Decimal("120.00")
        carteira = Conta.query.filter_by(nome="Carteira").first()
        assert saldo_conta(carteira) == saldo_antes - Decimal("80.00")
        parcela = Parcela.query.filter_by(cartao_id=cartao_id, ativo=True).first()
        assert parcela.pago is False
        assert Decimal(str(parcela.valor_pago)) == Decimal("80.00")
        mov = Movimentacao.query.filter(
            Movimentacao.descricao.like("Fatura Master parcial%parcial%")
        ).first()
        assert mov is not None
        assert mov.valor == Decimal("80.00")

    resto = admin_client.post(
        f"/cartoes/{cartao_id}/pagar",
        data={
            "conta_id": str(conta_id),
            "competencia": competencia.strftime("%Y-%m"),
            "data_pagamento": date.today().isoformat(),
            "valor": "120,00",
        },
        follow_redirects=True,
    )
    assert resto.status_code == 200
    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        aberto = total_fatura(parcelas_competencia(cartao, competencia), somente_abertas=True)
        assert aberto == Decimal("0.00")
        assert limite_usado(cartao) == Decimal("0.00")
        parcela = Parcela.query.filter_by(cartao_id=cartao_id, ativo=True).first()
        assert parcela.pago is True
        assert Decimal(str(parcela.valor_pago)) == Decimal("200.00")
        carteira = Conta.query.filter_by(nome="Carteira").first()
        assert saldo_conta(carteira) == saldo_antes - Decimal("200.00")


def test_nao_permite_pagar_mais_que_aberto(admin_client, app):
    cartao_id, conta_id, competencia, _ = _criar_cartao_com_compra(
        admin_client, app, nome="Amex limite", valor="50,00"
    )
    resp = admin_client.post(
        f"/cartoes/{cartao_id}/pagar",
        data={
            "conta_id": str(conta_id),
            "competencia": competencia.strftime("%Y-%m"),
            "data_pagamento": date.today().isoformat(),
            "valor": "80,00",
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "não pode ser maior" in resp.get_data(as_text=True).lower()
    with app.app_context():
        parcela = Parcela.query.filter_by(cartao_id=cartao_id, ativo=True).first()
        assert parcela.pago is False
        assert Decimal(str(parcela.valor_pago or 0)) == Decimal("0.00")


def test_pagamento_integral_sem_campo_valor_continua_ok(admin_client, app):
    """Compatibilidade: sem valor no form, quita o total em aberto."""
    cartao_id, conta_id, competencia, saldo_antes = _criar_cartao_com_compra(
        admin_client, app, nome="Visa integral", valor="75,00"
    )
    resp = admin_client.post(
        f"/cartoes/{cartao_id}/pagar",
        data={
            "conta_id": str(conta_id),
            "competencia": competencia.strftime("%Y-%m"),
            "data_pagamento": date.today().isoformat(),
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        assert total_fatura(parcelas_competencia(cartao, competencia), somente_abertas=True) == 0
        carteira = Conta.query.filter_by(nome="Carteira").first()
        assert saldo_conta(carteira) == saldo_antes - Decimal("75.00")
