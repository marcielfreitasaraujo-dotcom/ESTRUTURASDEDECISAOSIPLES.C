from datetime import date, timedelta
from decimal import Decimal

from app.extensions import db
from app.models import ContaPagar
from app.services.vencimentos import query_atrasadas, query_titulos


def test_atrasadas_no_banco_bate_com_status_atual(app):
    hoje = date.today()
    casos = [
        dict(vencimento=hoje - timedelta(days=3), status="pendente"),
        dict(vencimento=hoje - timedelta(days=3), status="pago"),
        dict(vencimento=hoje - timedelta(days=3), status="recebido", tipo="receber"),
        dict(vencimento=hoje - timedelta(days=3), status="pendente", data_pagamento=hoje),
        dict(vencimento=hoje - timedelta(days=1), status="pendente", ativo=False),
        dict(vencimento=hoje, status="pendente"),
        dict(vencimento=hoje + timedelta(days=5), status="pendente"),
        dict(vencimento=hoje - timedelta(days=10), status="pendente", tipo="receber"),
    ]
    with app.app_context():
        for i, extra in enumerate(casos):
            dados = dict(
                usuario_id=1,
                tipo="pagar",
                descricao=f"Título {i}",
                valor=Decimal("10.00"),
                ativo=True,
            )
            dados.update(extra)
            db.session.add(ContaPagar(**dados))
        db.session.commit()

        esperado = {t.id for t in query_titulos(1).all() if t.status_atual(hoje) == "atrasado"}
        obtido = {t.id for t in query_atrasadas(1, hoje).all()}
        assert obtido == esperado
        assert len(obtido) == 2


def test_recorrentes_geradas_uma_vez_por_dia_por_sessao(admin_client, monkeypatch):
    chamadas = []
    import app.services.recorrencias as rec

    original = rec.gerar_titulos_recorrentes

    def contar(uid, *a, **k):
        chamadas.append(uid)
        return original(uid, *a, **k)

    monkeypatch.setattr(rec, "gerar_titulos_recorrentes", contar)
    admin_client.get("/")
    admin_client.get("/vencimentos")
    admin_client.get("/")
    assert len(chamadas) == 0  # o login (fixture) já fez a conferência de hoje
