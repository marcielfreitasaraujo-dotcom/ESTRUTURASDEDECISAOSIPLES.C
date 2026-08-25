from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Cartao, Conta, Parcela
from app.services.cartoes import competencia_da_compra, limite_usado, parcelas_competencia


def test_detalhe_cartao_tem_menu_acoes(admin_client, app):
    resp = admin_client.post(
        "/cartoes/nova",
        data={
            "nome": "Visa acoes",
            "limite": "800,00",
            "dia_fechamento": "20",
            "dia_vencimento": "5",
        },
    )
    assert resp.status_code == 302
    with app.app_context():
        cartao_id = Cartao.query.filter_by(nome="Visa acoes").first().id

    admin_client.post(
        f"/cartoes/{cartao_id}/compra",
        data={
            "descricao": "Lanche teste",
            "valor": "59,00",
            "data": date.today().isoformat(),
            "parcelas": "1",
        },
    )
    html = admin_client.get(f"/cartoes/{cartao_id}").get_data(as_text=True)
    assert "data-menu-acoes" in html
    assert "data-editar-parcela" in html
    assert "Excluir" in html
    assert "modal-editar-parcela" in html


def test_editar_e_excluir_parcela_em_aberto(admin_client, app):
    admin_client.post(
        "/cartoes/nova",
        data={
            "nome": "Elo edit",
            "limite": "500,00",
            "dia_fechamento": "28",
            "dia_vencimento": "10",
        },
    )
    with app.app_context():
        cartao_id = Cartao.query.filter_by(nome="Elo edit").first().id

    admin_client.post(
        f"/cartoes/{cartao_id}/compra",
        data={
            "descricao": "Compra errada",
            "valor": "100,00",
            "data": date.today().isoformat(),
            "parcelas": "1",
        },
    )
    with app.app_context():
        parcela = Parcela.query.filter_by(cartao_id=cartao_id, ativo=True).first()
        parcela_id = parcela.id
        competencia = parcela.competencia.strftime("%Y-%m")

    edit = admin_client.post(
        f"/cartoes/{cartao_id}/parcelas/{parcela_id}/editar",
        data={
            "descricao": "Compra corrigida",
            "valor": "80,00",
            "categoria_id": "",
        },
        follow_redirects=True,
    )
    assert edit.status_code == 200
    assert "atualizado" in edit.get_data(as_text=True).lower()
    with app.app_context():
        parcela = db.session.get(Parcela, parcela_id)
        assert parcela.descricao == "Compra corrigida"
        assert parcela.valor_parcela == Decimal("80.00")
        assert limite_usado(parcela.cartao) == Decimal("80.00")

    excluir = admin_client.post(
        f"/cartoes/{cartao_id}/parcelas/{parcela_id}/excluir",
        follow_redirects=True,
    )
    assert excluir.status_code == 200
    with app.app_context():
        parcela = db.session.get(Parcela, parcela_id)
        assert parcela.ativo is False
        assert limite_usado(parcela.cartao) == Decimal("0.00")
        abertas = [
            p
            for p in parcelas_competencia(parcela.cartao, date.fromisoformat(f"{competencia}-01"))
            if not p.pago
        ]
        assert abertas == []


def test_nao_exclui_parcela_paga(admin_client, app):
    admin_client.post(
        "/cartoes/nova",
        data={
            "nome": "Master paga",
            "limite": "700,00",
            "dia_fechamento": "28",
            "dia_vencimento": "10",
        },
    )
    with app.app_context():
        cartao = Cartao.query.filter_by(nome="Master paga").first()
        cartao_id = cartao.id
        conta_id = Conta.query.filter_by(nome="Carteira").first().id

    admin_client.post(
        f"/cartoes/{cartao_id}/compra",
        data={
            "descricao": "Uber",
            "valor": "40,00",
            "data": date.today().isoformat(),
            "parcelas": "1",
        },
    )
    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        competencia = competencia_da_compra(cartao, date.today())
        parcela_id = Parcela.query.filter_by(cartao_id=cartao_id, ativo=True).first().id

    admin_client.post(
        f"/cartoes/{cartao_id}/pagar",
        data={
            "conta_id": str(conta_id),
            "competencia": competencia.strftime("%Y-%m"),
            "data_pagamento": date.today().isoformat(),
        },
    )
    resp = admin_client.post(
        f"/cartoes/{cartao_id}/parcelas/{parcela_id}/excluir",
        follow_redirects=True,
    )
    assert "já paga" in resp.get_data(as_text=True).lower() or "nao e possivel" in resp.get_data(as_text=True).lower() or "não é possível" in resp.get_data(as_text=True).lower()
    with app.app_context():
        assert db.session.get(Parcela, parcela_id).ativo is True
